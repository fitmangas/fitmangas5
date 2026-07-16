import { CommunityManagerBoard } from '@/components/Admin/community/CommunityManagerBoard';
import { requireAdmin } from '@/lib/auth/require-admin';
import { getSocialCommsBoard } from '@/lib/admin/social-comms';

export const dynamic = 'force-dynamic';

export default async function AdminCommunityPage() {
  await requireAdmin();
  const board = await getSocialCommsBoard();

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <CommunityManagerBoard board={board} />
    </main>
  );
}
