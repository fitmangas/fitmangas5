import Link from 'next/link';
import Image from 'next/image';

import { AdminSidebar } from '@/components/Admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="luxury-shell relative min-h-screen">
      <div className="luxury-bg-orbs" aria-hidden />
      <div className="luxury-grain" aria-hidden />
      <div className="relative z-10">
        <AdminSidebar />
      {/* Navigation mobile seulement */}
      <nav className="mx-4 mb-4 mt-4 md:hidden">
        <div className="glass-card flex flex-wrap gap-3 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-muted">
            <Link
              href="/admin/boutique"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/70 shadow-[0_6px_14px_rgba(15,23,42,0.1)]"
              aria-label="Ouvrir la boutique admin"
            >
              <Image
                src="/Spreadshop Logo (1800 x 1800 px)-2.png"
                alt="Logo boutique FitMangas"
                width={22}
                height={22}
                className="h-[22px] w-[22px] object-contain"
              />
            </Link>
            <Link href="/admin" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
              Dashboard
            </Link>
            <Link href="/admin/courses" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
              Séances
            </Link>
            <Link href="/admin/vimeo" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
              Vimeo
            </Link>
            <Link href="/admin/boutique" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
              Boutique
            </Link>
            <Link href="/admin/promos" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
              Promos
            </Link>
            <Link href="/admin/blog" className="rounded-full px-3 py-1.5 hover:bg-white/40 hover:text-luxury-ink">
              Blog
            </Link>
        </div>
      </nav>
      <div className="px-4 pb-16 md:pl-24">{children}</div>
      </div>
    </div>
  );
}
