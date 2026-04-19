import Link from 'next/link';

import { AdminSidebar } from '@/components/Admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <AdminSidebar />
      {/* Navigation mobile + marge pour barre latérale fixe */}
      <nav className="glass-card mx-4 mb-4 mt-4 px-4 py-3 md:ml-24 md:rounded-2xl md:border md:border-white/35 md:bg-white/25 md:backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-muted md:hidden">
            <Link href="/admin" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
              Dashboard
            </Link>
            <Link href="/admin/courses" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
              Séances
            </Link>
            <Link href="/admin/planning" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
              Planning
            </Link>
            <Link href="/admin/promos" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
              Promos
            </Link>
          </div>
          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft md:block">
            Administration Fit Mangas
          </p>
        </div>
      </nav>
      <div className="px-4 pb-16 md:pl-24">{children}</div>
    </div>
  );
}
