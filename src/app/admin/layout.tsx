import { AdminMobileBottomNav } from '@/components/Admin/AdminMobileBottomNav';
import { AdminSidebar } from '@/components/Admin/AdminSidebar';
import { AdminViewSwitch } from '@/components/Admin/AdminViewSwitch';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="luxury-shell relative min-h-screen">
      <div className="luxury-bg-orbs" aria-hidden />
      <div className="luxury-grain" aria-hidden />
      <div className="relative z-10">
        <AdminSidebar />
        <AdminViewSwitch />
        <AdminMobileBottomNav />
        <div className="px-4 pb-28 md:pb-16 md:pl-24">{children}</div>
      </div>
    </div>
  );
}
