import { notFound } from 'next/navigation';

import { ProgramDone } from '@/components/Programmes/ProgramDone';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { programBySlug } from '@/lib/programmes/catalogue';
import { createClient } from '@/lib/supabase/server';
import { hasVisioClientAccess } from '@/lib/access-control';
import { resolveFirstName } from '@/lib/compte/i18n';

export default async function ProgramDonePage({ params }: { params: Promise<{ slug: string }> }) {
  if (!isProgrammesEnabled()) notFound();
  const { slug } = await params;
  const program = programBySlug(slug);
  if (!program) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await hasVisioClientAccess(user.id))) notFound();
  const { data: profile } = await supabase.from('profiles').select('first_name').eq('id', user.id).maybeSingle();
  const next = program.next_slug ? programBySlug(program.next_slug) : undefined;
  return (
    <ProgramDone
      firstName={resolveFirstName(profile?.first_name, user.user_metadata) || 'toi'}
      programTitle={program.title.fr}
      slug={slug}
      nextSlug={program.next_slug}
      nextTitle={next?.title.fr}
      certificateUrl={`/api/programmes/certificat/apercu?slug=${slug}`}
      storyUrl={`/api/programmes/story/apercu?slug=${slug}`}
    />
  );
}
