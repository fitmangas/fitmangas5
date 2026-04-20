import Link from 'next/link';

import { AdminSidebar } from '@/components/Admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="luxury-bg-orbs" aria-hidden />
      <div className="luxury-grain" aria-hidden />
      <div className="relative z-10">
        <AdminSidebar />
      {/* Navigation mobile seulement */}
      <nav className="mx-4 mb-4 mt-4 md:hidden">
        <div className="glass-card flex flex-wrap gap-3 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-muted">
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
      </nav>
      <div className="px-4 pb-16 md:pl-24">{children}</div>
      </div>
    </div>
  );
}
