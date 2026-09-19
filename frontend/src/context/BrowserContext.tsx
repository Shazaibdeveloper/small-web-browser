// ============================================================================
// FILE: src/context/BrowserContext.tsx
// ============================================================================
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { api, type User, type Visit } from '@/lib/api';

/* --------------------------------------------------------------------------
 * The model, in one place.
 *
 *  trail   — an ordered list of visit ids. This is the *session trail*.
 *  cursor  — the index into it. Back and forward move the cursor; they do
 *            not write visits. Every new arrival truncates the trail at
 *            cursor+1, then appends — which is exactly how a real browser
 *            loses its forward history.
 *
 *  sessionStorage keyed by user id means each person's trail is theirs, and
 *  it survives a page reload without touching the server.
 *
 *  The archive — every arrival ever — lives on the server and is not
 *  truncated. That is the History panel; jumping from it *does* write a
 *  visit, with transition: 'history'.
 * ------------------------------------------------------------------------ */

type Transition = 'typed' | 'link' | 'history';

type Session = { trail: string[]; cursor: number };

type BrowserContextValue = {
  user: User | null;
  users: User[];
  chooseUser: (user: User) => void;

  trail: string[];
  cursor: number;
  currentVisit: Visit | null;
  canGoBack: boolean;
  canGoForward: boolean;

  loading: boolean;
  error: string | null;

  navigate: (address: string, transition?: Transition) => Promise<void>;
  back: () => void;
  forward: () => void;
  jumpTo: (visitId: string) => Promise<void>;
};

const BrowserContext = createContext<BrowserContextValue | null>(null);

const STORAGE_PREFIX = 'small-web.session.';

function readSession(userId: string): Session {
  if (typeof window === 'undefined') return { trail: [], cursor: -1 };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + userId);
    if (!raw) return { trail: [], cursor: -1 };
    const parsed = JSON.parse(raw) as Session;
    if (!Array.isArray(parsed.trail)) return { trail: [], cursor: -1 };
    const cursor =
      typeof parsed.cursor === 'number' &&
      parsed.cursor >= -1 &&
      parsed.cursor < parsed.trail.length
        ? parsed.cursor
        : parsed.trail.length - 1;
    return { trail: parsed.trail, cursor };
  } catch {
    return { trail: [], cursor: -1 };
  }
}

function writeSession(userId: string, s: Session) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(s));
  } catch {
    // Quota exceeded, or storage disabled — the trail simply won't persist.
  }
}

export function BrowserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session>({ trail: [], cursor: -1 });
  const [currentVisit, setCurrentVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-mount cache of visits we have already fetched, so back/forward
  // between pages we have already seen is instant.
  const visitCache = useRef(new Map<string, Visit>());

  const { trail, cursor } = session;

  /* --- load the user list once ------------------------------------------- */
  useEffect(() => {
    let cancelled = false;
    api.users
      .list()
      .then((list) => {
        if (!cancelled) setUsers(list);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Could not load people.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* --- when the person changes, swap trails ------------------------------ */
  useEffect(() => {
    if (!user) {
      setSession({ trail: [], cursor: -1 });
      setCurrentVisit(null);
      return;
    }
    visitCache.current.clear();
    setCurrentVisit(null);
    setSession(readSession(user.id));
  }, [user]);

  /* --- persist the trail per person -------------------------------------- */
  useEffect(() => {
    if (!user) return;
    writeSession(user.id, session);
  }, [user, session]);

  /* --- fetch the visit at the cursor ------------------------------------- */
  const currentVisitId = trail[cursor] ?? null;

  useEffect(() => {
    if (!currentVisitId) {
      setCurrentVisit(null);
      return;
    }

    const cached = visitCache.current.get(currentVisitId);
    if (cached) {
      setCurrentVisit(cached);
      return;
    }

    let cancelled = false;
    setLoading(true);
    api.visits
      .get(currentVisitId)
      .then((v) => {
        if (cancelled) return;
        visitCache.current.set(currentVisitId, v);
        setCurrentVisit(v);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Could not restore that visit.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentVisitId]);

  /* --- actions ----------------------------------------------------------- */

  const chooseUser = useCallback((next: User) => {
    setUser(next);
    setError(null);
  }, []);

  /**
   * An arrival. Writes a visit on the server, then truncates the forward
   * half of the trail and appends the new visit id.
   */
  const navigate = useCallback(
    async (address: string, transition: Transition = 'typed') => {
      if (!user) return;
      const trimmed = address.trim();
      if (!trimmed) return;

      setLoading(true);
      setError(null);
      try {
        const fromVisitId = trail[cursor];

        const visit = await api.visits.record({
          userId: user.id,
          address: trimmed,
          transition,
          fromVisitId,
        });

        visitCache.current.set(visit.id, visit);

        setSession((prev) => {
          const truncated = prev.trail.slice(0, prev.cursor + 1);
          const nextTrail = [...truncated, visit.id];
          return { trail: nextTrail, cursor: nextTrail.length - 1 };
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Navigation failed.');
      } finally {
        setLoading(false);
      }
    },
    [user, trail, cursor],
  );

  const back = useCallback(() => {
    setSession((prev) =>
      prev.cursor > 0 ? { ...prev, cursor: prev.cursor - 1 } : prev,
    );
  }, []);

  const forward = useCallback(() => {
    setSession((prev) =>
      prev.cursor < prev.trail.length - 1
        ? { ...prev, cursor: prev.cursor + 1 }
        : prev,
    );
  }, []);

  /**
   * A jump from the history panel. Different from back/forward: it is a new
   * arrival, so it writes a visit with transition: 'history'.
   */
  const jumpTo = useCallback(
    async (visitId: string) => {
      if (!user) return;
      try {
        const source = await api.visits.get(visitId);
        await navigate(source.address, 'history');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not jump to that visit.');
      }
    },
    [user, navigate],
  );

  const value = useMemo<BrowserContextValue>(
    () => ({
      user,
      users,
      chooseUser,
      trail,
      cursor,
      currentVisit,
      canGoBack: cursor > 0,
      canGoForward: cursor >= 0 && cursor < trail.length - 1,
      loading,
      error,
      navigate,
      back,
      forward,
      jumpTo,
    }),
    [
      user,
      users,
      chooseUser,
      trail,
      cursor,
      currentVisit,
      loading,
      error,
      navigate,
      back,
      forward,
      jumpTo,
    ],
  );

  return (
    <BrowserContext.Provider value={value}>{children}</BrowserContext.Provider>
  );
}

export function useBrowser(): BrowserContextValue {
  const ctx = useContext(BrowserContext);
  if (!ctx) throw new Error('useBrowser must be used inside <BrowserProvider>.');
  return ctx;
}