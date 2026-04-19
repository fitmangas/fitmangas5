import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { JitsiRoomLoader } from '@/components/Jitsi/JitsiRoomLoader';
import { LiveVisitRecorder } from '@/components/Live/LiveVisitRecorder';
import { ReplayViewTracker } from '@/components/Replay/ReplayViewTracker';
import { VimeoReplayWithResume } from '@/components/Replay/VimeoReplayWithResume';
import {
  getAccessType,
  getUserLivePrivileges,
  type UserLivePrivileges,
} from '@/lib/access-control';
import { checkIsAdmin } from '@/lib/auth/admin';
import { getDemoClientMode } from '@/lib/demo-client-mode';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ preview?: string | string[] }>;
}) {
  const { courseId } = await params;
  const urlParams = await searchParams;
  const previewRaw = urlParams.preview;
  const previewToken =
    typeof previewRaw === 'string' ? previewRaw : Array.isArray(previewRaw) ? previewRaw[0] : undefined;
  const studentPreview =
    previewToken === 'client' || previewToken === 'eleve' || previewToken === 'student';

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

  const realAdmin = (await checkIsAdmin(supabase, user)).isAdmin;
  const globalDemo = (await getDemoClientMode()) && realAdmin;
  const effectiveStudentPreview = studentPreview || globalDemo;

  let allowed = false;
  let isModerator = false;
  let livePriv: UserLivePrivileges | undefined;
  try {
    livePriv = await getUserLivePrivileges(user.id);
    const accessFull = (await getAccessType(user.id, idParsed.data)) === 'full';

    if (effectiveStudentPreview) {
      allowed = accessFull || livePriv.isAdmin;
      isModerator = false;
    } else {
      isModerator = livePriv.isAdmin;
      allowed = livePriv.isAdmin || accessFull;
    }
  } catch {
    return <AccessDenied subtitle="Impossible de vérifier ton accès." />;
  }

  if (!allowed || !livePriv) {
    return <AccessDenied subtitle="Tu n’as pas accès à ce live." />;
  }

  const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).maybeSingle();

  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
    (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '') ||
    user.email?.split('@')[0] ||
    'Participant';

  const emailForJitsi = user.email ?? '';

  const { data: course, error } = await supabase
    .from('courses')
    .select('id, title, jitsi_link, ends_at, spotify_playlist_url')
    .eq('id', idParsed.data)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !course) {
    return <AccessDenied subtitle="Séance introuvable." />;
  }

  const courseEndedAt = new Date(course.ends_at);
  const courseIsPast = !Number.isNaN(courseEndedAt.getTime()) && courseEndedAt < new Date();

  const useAdminReplayFetch = realAdmin;

  const { data: replay } = useAdminReplayFetch
    ? await createAdminClient()
        .from('video_recordings')
        .select('id, embed_url, title')
        .eq('course_id', idParsed.data)
        .eq('is_ready', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : await supabase
        .from('video_recordings')
        .select('id, embed_url, title')
        .eq('course_id', idParsed.data)
        .eq('is_ready', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

  const replayEmbedUrl = replay?.embed_url?.trim() ?? '';
  const showVimeoReplay = courseIsPast && replayEmbedUrl.length > 0;
  const hasJitsi = !!course.jitsi_link?.trim();
  const spotifyUrl = course.spotify_playlist_url?.trim() ?? '';

  let initialReplaySeconds = 0;
  if (replay?.id && showVimeoReplay) {
    const { data: prog, error: progErr } = await supabase
      .from('replay_playback_progress')
      .select('position_seconds')
      .eq('recording_id', replay.id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!progErr && prog) {
      initialReplaySeconds = prog.position_seconds ?? 0;
    }
  }

  // Live à venir ou en cours : la salle Jitsi est obligatoire tant qu’il n’y a pas de replay.
  if (!showVimeoReplay && !hasJitsi && !courseIsPast) {
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
        {effectiveStudentPreview ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-[11px] leading-relaxed text-amber-950 shadow-sm">
            <strong className="font-semibold">{globalDemo ? 'Mode démo · ' : ''}Aperçu élève</strong> — Rendu comme un
            élève avec accès complet ({!courseIsPast ? 'live / Jitsi' : 'replay'}). Pas de droits animateur.
          </div>
        ) : null}
        {showVimeoReplay ? (
          <>
            {replay?.id ? <ReplayViewTracker recordingId={replay.id} /> : null}
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-accent">Replay</p>
            <VimeoReplayWithResume
              embedUrl={replayEmbedUrl}
              title={replay?.title?.trim() || `Replay — ${course.title}`}
              recordingId={replay?.id ?? null}
              initialSeconds={initialReplaySeconds}
            />
            {spotifyUrl ? (
              <p className="text-sm text-brand-ink/70">
                <span className="font-semibold text-brand-ink">Playlist :</span>{' '}
                <a
                  href={spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-accent underline-offset-4 hover:underline"
                >
                  Ouvrir sur Spotify
                </a>
              </p>
            ) : null}
          </>
        ) : courseIsPast ? (
          <div className="rounded-2xl border border-brand-ink/10 bg-white px-6 py-10 text-center shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-ink/45">Séance terminée</p>
            <h2 className="mt-3 font-serif text-xl italic text-brand-ink">Replay en préparation</h2>
            <p className="mt-3 text-sm text-brand-ink/65">
              La vidéo sera disponible ici dès qu’elle aura été traitée. Repasse un peu plus tard.
            </p>
          </div>
        ) : (
          <>
            <LiveVisitRecorder courseId={course.id} />
            <JitsiRoomLoader
              courseId={course.id}
              roomUrl={course.jitsi_link!}
              title={`Live — ${course.title}`}
              displayName={displayName}
              email={emailForJitsi}
              isModerator={isModerator}
              studentPreview={effectiveStudentPreview}
            />
            {spotifyUrl ? (
              <p className="text-sm text-brand-ink/70">
                <span className="font-semibold text-brand-ink">Playlist séance :</span>{' '}
                <a
                  href={spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-accent underline-offset-4 hover:underline"
                >
                  Spotify
                </a>
              </p>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
