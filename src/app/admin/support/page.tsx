import { redirect } from 'next/navigation';

/** Ancienne URL — regroupée dans /admin/inbox */
export default function AdminSupportRedirectPage() {
  redirect('/admin/inbox?tab=tickets');
}
