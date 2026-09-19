// ============================================================================
// FILE: src/components/AddressBar.tsx
// ============================================================================
'use client';

import { useEffect, useState } from 'react';
import { useBrowser } from '@/context/BrowserContext';

export function AddressBar() {
  const { currentVisit, navigate, loading } = useBrowser();
  const [value, setValue] = useState('');

  // Sync the input to the visit at the cursor, but only when *that* changes —
  // typing does not get clobbered.
  useEffect(() => {
    setValue(currentVisit?.address ?? '');
  }, [currentVisit?.id, currentVisit?.address]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        void navigate(value, 'typed');
      }}
      className="flex-1"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="type an address — try tidepool.zz"
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        className={`w-full rounded-full border bg-white px-4 py-1.5 font-mono text-sm outline-none transition-colors ${
          loading
            ? 'border-blue-400 text-neutral-500'
            : 'border-neutral-300 text-neutral-900 focus:border-neutral-900'
        }`}
      />
    </form>
  );
}