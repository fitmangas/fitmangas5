import { redirect } from 'next/navigation';

export default function AdminVimeoRedirectPage() {
  redirect('/admin/videos?section=library');
}
