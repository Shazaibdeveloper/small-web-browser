// ============================================================================
// FILE: src/app/layout.tsx
// ============================================================================
import type { Metadata } from 'next';
import './globals.css';
import { BrowserProvider } from '@/context/BrowserContext';
import { BrowserChrome } from '@/components/BrowserChrome';

export const metadata: Metadata = {
  title: 'The Small Web',
  description: 'A tiny browser over a tiny web.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <BrowserProvider>
          <BrowserChrome />
          <main className="mx-auto max-w-5xl">{children}</main>
        </BrowserProvider>
      </body>
    </html>
  );
}