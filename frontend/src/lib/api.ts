// ============================================================================
// FILE: src/lib/api.ts
// ============================================================================
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

/* --- types mirroring the backend ------------------------------------------ */

export type User = {
  id: string;
  name: string;
  bio: string;
};

export type SiteSummary = {
  address: string;
  title: string;
  authorId: string;
  updatedAt: string | null;
};

export type Site = SiteSummary & {
  id: string;
  html: string;
  revision: number;
};

export type VisitSummary = {
  id: string;
  userId: string;
  address: string;
  title: string | null;
  siteId: string | null;
  authorId: string | null;
  transition: 'typed' | 'link' | 'history';
  isError: boolean;
  visitedAt: string;
};

export type Visit = VisitSummary & {
  html: string | null;
  fromVisitId: string | null;
};

export type SearchHit = {
  address: string;
  title: string;
  authorId: string;
  snippet: string;
};

export type HistoryPage = {
  total: number;
  limit: number;
  skip: number;
  items: VisitSummary[];
};

/* --- one fetch wrapper ---------------------------------------------------- */

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    ...init,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      body ? `${res.status} ${res.statusText} — ${body}` : `${res.status} ${res.statusText}`,
    );
  }

  return (await res.json()) as T;
}

/* --- the surface ---------------------------------------------------------- */

export const api = {
  users: {
    list: () => jsonFetch<User[]>('/users'),
  },

  sites: {
    list: () => jsonFetch<SiteSummary[]>('/sites'),

    resolve: (address: string) =>
      jsonFetch<
        | { found: true; site: Site }
        | { found: false; address: string }
      >(`/sites/${encodeURIComponent(address)}`),

    search: (q: string, limit = 20) =>
      jsonFetch<SearchHit[]>(
        `/sites/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      ),

    publish: (body: {
      address: string;
      title: string;
      html: string;
      authorId: string;
    }) =>
      jsonFetch<Site>('/sites', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  visits: {
    record: (body: {
      userId: string;
      address: string;
      transition?: 'typed' | 'link' | 'history';
      fromVisitId?: string;
    }) =>
      jsonFetch<Visit>('/visits', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    get: (id: string) => jsonFetch<Visit>(`/visits/${id}`),

    history: (
      userId: string,
      opts: { limit?: number; skip?: number; q?: string } = {},
    ) => {
      const params = new URLSearchParams({ userId });
      if (opts.limit) params.set('limit', String(opts.limit));
      if (opts.skip) params.set('skip', String(opts.skip));
      if (opts.q) params.set('q', opts.q);
      return jsonFetch<HistoryPage>(`/visits?${params.toString()}`);
    },

    clear: (userId: string) =>
      jsonFetch<{ deleted: number }>(
        `/visits?userId=${encodeURIComponent(userId)}`,
        { method: 'DELETE' },
      ),
  },
};