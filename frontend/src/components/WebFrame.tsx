// ============================================================================
// FILE: src/components/WebFrame.tsx
// ============================================================================
'use client';

import { useMemo } from 'react';
import { useBrowser } from '@/context/BrowserContext';
import { sanitizeForDisplay } from '@/lib/sanitize';

export function WebFrame() {
  const { currentVisit, navigate, loading } = useBrowser();

  const html = useMemo(() => {
    if (!currentVisit || currentVisit.isError || !currentVisit.html) return '';
    return sanitizeForDisplay(currentVisit.html);
  }, [currentVisit]);

  if (loading && !currentVisit) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center font-mono text-sm text-neutral-400">
        loading…
      </div>
    );
  }

  if (!currentVisit) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-400">
            the small web
          </p>
          <p className="mt-4 text-lg text-neutral-700">Nowhere yet.</p>
          <p className="mt-2 text-sm text-neutral-500">
            Type an address in the bar above, or open{' '}
            <a href="/search" className="underline">
              search
            </a>{' '}
            and find a page.
          </p>
        </div>
      </div>
    );
  }

  if (currentVisit.isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-red-600">
            nowhere
          </p>
          <p className="mt-3 break-all font-mono text-lg text-neutral-900">
            {currentVisit.address}
          </p>
          <p className="mt-3 text-sm text-neutral-500">
            There is no page at that address. It has never existed.
          </p>
        </div>
      </div>
    );
  }

  /**
   * Link interception.
   *
   * The backend rewrote every author anchor to
   *   <a data-address="tidepool.zz" href="#/tidepool.zz">
   * and the client sanitizer left that shape intact. We catch the click at
   * the wrapper, resolve the address, and hand it to the trail. `#/…` is
   * never allowed to become a real fragment navigation — preventDefault
   * stops it before the URL bar sees it.
   */
  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = (e.target as HTMLElement | null)?.closest(
      'a[data-address]',
    ) as HTMLAnchorElement | null;
    if (!a) return;
    const address = a.getAttribute('data-address');
    if (!address) return;
    e.preventDefault();
    void navigate(address, 'link');
  };

  return (
    <div onClick={onClick}>
      <article
        key={currentVisit.id}
        className="prose-smallweb mx-auto max-w-2xl px-6 py-10"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}