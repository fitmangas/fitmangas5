import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="border-b border-neutral-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-4 text-xs font-semibold uppercase tracking-wide text-neutral-600">
          <Link href="/admin" className="hover:text-neutral-900">
            Dashboard
          </Link>
          <Link href="/admin/courses" className="hover:text-neutral-900">
            Séances
          </Link>
          <Link href="/admin/planning" className="hover:text-neutral-900">
            Planning
          </Link>
          <Link href="/admin/promos" className="hover:text-neutral-900">
            Codes promos
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
