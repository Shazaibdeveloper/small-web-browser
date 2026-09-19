// ============================================================================
// FILE: src/app/page.tsx
// ============================================================================
'use client';

import { useBrowser } from '@/context/BrowserContext';
import { WebFrame } from '@/components/WebFrame';

export default function HomePage() {
  const { user } = useBrowser();

  if (!user) return <PickAPerson />;

  return <WebFrame />;
}

function PickAPerson() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-400">
          the small web
        </p>
        <p className="mt-4 text-lg text-neutral-700">
          Pick a person to browse as.
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          The dropdown in the top right lists every identity that exists here.
          Whichever you choose, the history you build belongs to that person.
        </p>
      </div>
    </div>
  );
}