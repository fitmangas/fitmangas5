import { AdminMobileBottomNav } from '@/components/Admin/AdminMobileBottomNav';
import { AdminSidebar } from '@/components/Admin/AdminSidebar';
import { requireAdmin } from '@/lib/auth/require-admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="luxury-shell admin-area relative min-h-screen">
      <div className="luxury-bg-orbs" aria-hidden />
      <div className="luxury-grain" aria-hidden />
      <div className="relative z-10">
        <AdminSidebar />
        <AdminMobileBottomNav />
        <main className="luxury-main pb-16 pt-24 md:pb-16 md:pl-24 md:pt-0">{children}</main>
      </div>
    </div>
  );
}
