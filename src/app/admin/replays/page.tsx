import { redirect } from 'next/navigation';

export default function AdminReplaysRedirectPage() {
  redirect('/admin/videos?section=replays');
}
