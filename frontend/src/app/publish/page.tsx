// ============================================================================
// FILE: src/app/publish/page.tsx
// ============================================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useBrowser } from '@/context/BrowserContext';

export default function PublishPage() {
  const { user, navigate } = useBrowser();
  const router = useRouter();

  const [address, setAddress] = useState('');
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          publish
        </h1>
        <p className="mt-2 text-2xl font-semibold">
          A page, at an address, by{' '}
          <span className="text-neutral-400">{user.name}</span>
        </p>
        <p className="mt-1 max-w-2xl text-sm text-neutral-500">
          The address is the only thing that can be typed or linked to. If
          someone else already owns it, publishing fails.
        </p>
      </header>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await api.sites.publish({
              address: address.trim(),
              title: title.trim(),
              html,
              authorId: user.id,
            });
            await navigate(address.trim(), 'typed');
            router.push('/');
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Publish failed.');
          } finally {
            setBusy(false);
          }
        }}
        className="space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="tidepool.zz"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm focus:border-neutral-900 focus:outline-none"
              required
              minLength={3}
            />
            <p className="mt-1 text-xs text-neutral-500">
              lowercase, at least one dot
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-neutral-900 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">HTML</label>
          <p className="mt-1 text-xs text-neutral-500">
            Scripts, styles, iframes, forms and inline handlers are stripped on
            the server. Every <code>&lt;a href&gt;</code> is rewritten into a
            real, clickable address — including ones that go nowhere.
          </p>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={16}
            className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-[13px] leading-relaxed focus:border-neutral-900 focus:outline-none"
            placeholder={`<h1>Hello</h1>\n<p>Try <a href="tidepool.zz">tidepool.zz</a>.</p>`}
            required
          />
        </div>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-neutral-900 px-5 py-2 text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {busy ? 'publishing…' : 'publish'}
        </button>
      </form>
    </div>
  );
}