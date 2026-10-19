import Link from 'next/link';
import { notFound } from 'next/navigation';

import { isDevPreviewEnabled } from '@/lib/dev/preview-guard';

import { PREVIEWS } from './registry';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default function DevPreviewIndex() {
  if (!isDevPreviewEnabled()) notFound();
  return (
    <main className="mx-auto max-w-2xl p-8 font-sans">
      <h1 className="text-xl font-semibold">Aperçus de développement (données fictives)</h1>
      <ul className="mt-6 space-y-2 text-sm">
        {PREVIEWS.map((p) => (
          <li key={p.slug}>
            <span className="mr-2 rounded bg-black/5 px-2 py-0.5 text-xs">Lot {p.lot}</span>
            <Link className="underline" href={`/dev/apercu/${p.slug}`}>
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
