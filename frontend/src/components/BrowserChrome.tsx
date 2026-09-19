// ============================================================================
// FILE: src/components/BrowserChrome.tsx
// ============================================================================
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useBrowser } from '@/context/BrowserContext';
import { AddressBar } from './AddressBar';
import { UserSelector } from './UserSelector';

export function BrowserChrome() {
  const { back, forward, canGoBack, canGoForward } = useBrowser();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2.5">
        <button
          type="button"
          onClick={back}
          disabled={!canGoBack}
          aria-label="Back"
          title="Back"
          className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ←
        </button>
        <button
          type="button"
          onClick={forward}
          disabled={!canGoForward}
          aria-label="Forward"
          title="Forward"
          className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          →
        </button>

        <AddressBar />

        <nav className="hidden items-center gap-0.5 md:flex">
          <ChromeLink href="/" active={pathname === '/'}>
            browse
          </ChromeLink>
          <ChromeLink href="/history" active={pathname === '/history'}>
            history
          </ChromeLink>
          <ChromeLink href="/search" active={pathname === '/search'}>
            search
          </ChromeLink>
          <ChromeLink href="/publish" active={pathname === '/publish'}>
            publish
          </ChromeLink>
        </nav>

        <UserSelector />
      </div>
    </header>
  );
}

function ChromeLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        'rounded-md px-2.5 py-1.5 font-mono text-[12px] tracking-wide transition-colors ' +
        (active
          ? 'bg-neutral-900 text-white'
          : 'text-neutral-600 hover:bg-neutral-200')
      }
    >
      {children}
    </Link>
  );
}