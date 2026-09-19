// ============================================================================
// FILE: src/components/UserSelector.tsx
// ============================================================================
'use client';

import { useBrowser } from '@/context/BrowserContext';

export function UserSelector() {
  const { user, users, chooseUser } = useBrowser();

  if (users.length === 0) {
    return (
      <span className="font-mono text-xs text-neutral-400">loading people…</span>
    );
  }

  return (
    <label className="flex items-center gap-2">
      <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">
        as
      </span>
      <select
        value={user?.id ?? ''}
        onChange={(e) => {
          const next = users.find((u) => u.id === e.target.value);
          if (next) chooseUser(next);
        }}
        className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm focus:border-neutral-900 focus:outline-none"
      >
        <option value="" disabled>
          pick a person
        </option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </label>
  );
}