// ============================================================================
// FILE: src/app/search/page.tsx
// ============================================================================
'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, type SearchHit } from '@/lib/api';
import { useBrowser } from '@/context/BrowserContext';

export default function SearchPage() {
  return (
    <Suspense
      fallback={<p className="px-6 py-10 text-sm text-neutral-400">loading…</p>}
    >
      <SearchView />
    </Suspense>
  );
}

function SearchView() {
  const { navigate } = useBrowser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlQ = searchParams.get('q') ?? '';
  const [input, setInput] = useState(urlQ);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    setInput(urlQ);
  }, [urlQ]);

  const run = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setHits([]);
      setHasRun(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.sites.search(trimmed, 30);
      setHits(res);
      setHasRun(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void run(urlQ);
  }, [urlQ, run]);

  return (
    <div className="px-6 py-8">
      <header className="mb-6">
        <h1 className="font-mono text-[11px] uppercase tracking-widest text-neutral-400">
          search
        </h1>
        <p className="mt-2 text-2xl font-semibold">
          Every page, by what is written in it
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Full-text across titles and bodies of everything published here.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = input.trim();
          if (!trimmed) return;
          router.push(`/search?q=${encodeURIComponent(trimmed)}`);
        }}
        className="mb-6 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="what is written in the page"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 focus:border-neutral-900 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700"
        >
          search
        </button>
      </form>

      {loading && <p className="text-sm text-neutral-400">searching…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && hasRun && hits.length === 0 && (
        <p className="text-sm text-neutral-500">
          Nothing matches “{urlQ}”.
        </p>
      )}

      {hits.length > 0 && (
        <p className="mb-3 text-sm text-neutral-500">
          {hits.length} {hits.length === 1 ? 'result' : 'results'}
        </p>
      )}

      <ul className="space-y-3">
        {hits.map((h) => (
          <li
            key={h.address}
            className="rounded-md border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-400"
          >
            <button
              type="button"
              onClick={async () => {
                await navigate(h.address, 'typed');
                router.push('/');
              }}
              className="block w-full text-left"
            >
              <div className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                {h.address}
              </div>
              <div className="mt-0.5 font-semibold text-neutral-900">
                {h.title}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                {h.snippet}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}