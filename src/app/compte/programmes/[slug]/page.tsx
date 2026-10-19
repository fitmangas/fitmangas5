import { notFound } from 'next/navigation';

import { ProgramDetailClient } from '@/components/Programmes/ProgramDetailClient';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { programBySlug } from '@/lib/programmes/catalogue';
import { createClient } from '@/lib/supabase/server';
import { hasVisioClientAccess } from '@/lib/access-control';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function ProgramDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ decaler?: string }>;
}) {
  if (!isProgrammesEnabled()) notFound();
  const { slug } = await params;
  const program = programBySlug(slug);
  if (!program) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await hasVisioClientAccess(user.id))) notFound();

  const q = await searchParams;
  let mode: 'discovery' | 'active' | 'done' = 'discovery';
  let enrollmentId: string | undefined;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('programs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (data?.id) {
      const { data: enr } = await admin
        .from('program_enrollments')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('program_id', data.id)
        .in('status', ['active', 'paused', 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (enr?.status === 'completed') mode = 'done';
      else if (enr?.status === 'active' || enr?.status === 'paused') mode = 'active';
      if (enr?.id) enrollmentId = String(enr.id);
    }
  } catch {
    mode = 'discovery';
  }

  return (
    <ProgramDetailClient
      program={program}
      mode={mode}
      postponePrompt={q.decaler === '1'}
      enrollmentId={enrollmentId}
    />
  );
}
