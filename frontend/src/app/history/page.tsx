// ============================================================================
// FILE: src/app/history/page.tsx
// ============================================================================
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type VisitSummary } from '@/lib/api';
import { useBrowser } from '@/context/BrowserContext';

export default function HistoryPage() {
  const { user, jumpTo } = useBrowser();
  const router = useRouter();

  const [items, setItems] = useState<VisitSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.visits.history(user.id, {
        limit: 200,
        q: appliedQuery || undefined,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load history.');
    } finally {
      setLoading(false);
    }
  }, [user, appliedQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) {
    return (
      <p className="px-6 py-10 text-sm text-neutral-500">
        Pick a person first — the dropdown in the top right.
      </p>
    );
  }

  return (
    <div className="px-6 py-8">
      <header className="mb-6">
        <h1 className="font-mono text-[11px] uppercase tracking-widest text-neutral-400">
          history
        </h1>
        <p className="mt-2 text-2xl font-semibold">
          Everywhere <span className="text-neutral-400">{user.name}</span> has been
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          {total} {total === 1 ? 'arrival' : 'arrivals'}, newest first.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedQuery(query);
        }}
        className="mb-5 flex gap-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="filter by address or title"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
        >
          filter
        </button>
      </form>

      {loading && <p className="text-sm text-neutral-400">loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && items.length === 0 && (
        <p className="text-sm text-neutral-500">Nothing here yet.</p>
      )}

      <ul className="divide-y divide-neutral-200 overflow-hidden rounded-md border border-neutral-200">
        {items.map((v) => (
          <li
            key={v.id}
            className="flex items-center gap-3 bg-white px-4 py-3 transition-colors hover:bg-neutral-50"
          >
            <button
              type="button"
              onClick={async () => {
                await jumpTo(v.id);
                router.push('/');
              }}
              className="flex-1 text-left"
            >
              <div className="font-mono text-sm text-neutral-900">
                {v.address}
              </div>
              <div className="mt-0.5 text-sm text-neutral-600">
                {v.isError ? (
                  <span className="text-red-600">nowhere</span>
                ) : (
                  v.title ?? '—'
                )}
              </div>
            </button>
            <div className="shrink-0 text-right text-[11px] text-neutral-400">
              <div>{new Date(v.visitedAt).toLocaleString()}</div>
              <div className="mt-0.5 font-mono uppercase tracking-wider">
                {v.transition}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}