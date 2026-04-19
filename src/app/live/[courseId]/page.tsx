import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { JitsiRoom } from '@/components/Jitsi/JitsiRoom';
import { canAccessCourse } from '@/lib/access-control';
import { createClient } from '@/lib/supabase/server';

const uuidSchema = z.string().uuid();

function AccessDenied({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-brand-beige px-6 py-16">
      <div className="max-w-md rounded-[28px] border border-brand-ink/[0.08] bg-white px-8 py-10 text-center shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-red-700">Accès refusé</p>
        <h1 className="mt-3 font-serif text-2xl italic text-brand-ink">{subtitle}</h1>
        <p className="mt-4 text-sm text-brand-ink/65">
          Tu n’as pas accès complet à cette séance, ou le lien n’est pas valide.
        </p>
        <Link
          href="/compte"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-accent px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white hover:opacity-95"
        >
          <ArrowLeft size={14} />
          Retour au calendrier
        </Link>
      </div>
    </div>
  );
}

export default async function LiveCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const idParsed = uuidSchema.safeParse(courseId);
  if (!idParsed.success) {
    return <AccessDenied subtitle="Lien invalide." />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AccessDenied subtitle="Connexion requise." />;
  }

  let allowed = false;
  try {
    allowed = await canAccessCourse(user.id, idParsed.data);
  } catch {
    return <AccessDenied subtitle="Impossible de vérifier ton accès." />;
  }

  if (!allowed) {
    return <AccessDenied subtitle="Tu n’as pas accès à ce live." />;
  }

  const { data: course, error } = await supabase
    .from('courses')
    .select('id, title, jitsi_link')
    .eq('id', idParsed.data)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !course) {
    return <AccessDenied subtitle="Séance introuvable." />;
  }

  if (!course.jitsi_link?.trim()) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-brand-beige px-6 py-16">
        <div className="max-w-md rounded-[28px] border border-brand-ink/[0.08] bg-white px-8 py-10 text-center shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-accent">Live</p>
          <h1 className="mt-3 font-serif text-2xl italic text-brand-ink">Live non configuré</h1>
          <p className="mt-4 text-sm text-brand-ink/65">
            Aucune salle Jitsi n’est encore renseignée pour cette séance.
          </p>
          <Link
            href="/compte"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-accent px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white hover:opacity-95"
          >
            <ArrowLeft size={14} />
            Retour au calendrier
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-beige">
      <header className="border-b border-brand-ink/[0.06] bg-white px-4 py-4 shadow-sm sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Link
              href="/compte"
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-ink/50 hover:text-brand-ink"
            >
              <ArrowLeft size={14} />
              Calendrier
            </Link>
            <h1 className="mt-2 truncate font-serif text-xl italic text-brand-ink sm:text-2xl">{course.title}</h1>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-6 sm:px-8">
        <JitsiRoom roomUrl={course.jitsi_link} title={`Live — ${course.title}`} />
      </main>
    </div>
  );
}
