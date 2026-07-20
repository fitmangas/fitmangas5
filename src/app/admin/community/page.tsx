import { CommunityManagerBoard } from '@/components/Admin/community/CommunityManagerBoard';
import { requireAdmin } from '@/lib/auth/require-admin';
import { metaAppConfigured } from '@/lib/admin/meta-social';
import { getMetaSocialConnection, getSocialCommsBoard } from '@/lib/admin/social-comms';

export const dynamic = 'force-dynamic';

export default async function AdminCommunityPage() {
  await requireAdmin();
  const [board, meta] = await Promise.all([getSocialCommsBoard(), getMetaSocialConnection()]);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <CommunityManagerBoard board={board} meta={meta} metaAppReady={metaAppConfigured()} />
    </main>
  );
}
