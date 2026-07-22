'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { EndLiveControls } from '@/components/Live/EndLiveControls';
import { buildJitsiConfigOverwrite, buildJitsiInterfaceConfigOverwrite } from '@/lib/jitsi/embed-config';
import { resolveJitsiEmbedFromRoomUrl } from '@/lib/jitsi/embed-from-room-url';

function loadExternalApiScript(scriptOrigin: string): Promise<void> {
  const src = `${scriptOrigin.replace(/\/$/, '')}/external_api.js`;
  const existing = Array.from(document.scripts).find((s) => s.src === src) as HTMLScriptElement | undefined;
  if (existing) {
    if (existing.dataset.loaded === 'true') return Promise.resolve();
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Script Jitsi')), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Impossible de charger ${src}`));
    document.head.appendChild(script);
  });
}

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function isDocumentFullscreen(): boolean {
  return Boolean(document.fullscreenElement ?? (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement);
}

async function requestElementFullscreen(element: FullscreenElement): Promise<void> {
  if (element.requestFullscreen) {
    await element.requestFullscreen();
    return;
  }
  await element.webkitRequestFullscreen?.();
}

async function exitDocumentFullscreen(): Promise<void> {
  if (document.exitFullscreen) {
    await document.exitFullscreen();
    return;
  }
  await (document as Document & { webkitExitFullscreen?: () => Promise<void> | void }).webkitExitFullscreen?.();
}

export type JitsiRoomProps = {
  roomUrl: string;
  title?: string;
  /** Nom affiché dans la conférence */
  displayName: string;
  email: string;
  /** Admin Fit Mangas → réglages type modérateur (meet.jit.si reste limité sans JWT ; utile sur instance dédiée). */
  isModerator: boolean;
  /** JWT Jitsi (JaaS ou serveur auto-heberge avec auth token). */
  jwt?: string;
  /** Si fourni avec isModerator : bouton « Fin du live » sous la vidéo. */
  courseId?: string;
  /** Masque le bouton (ex. aperçu élève). */
  hideEndLive?: boolean;
};

type JitsiMeetApi = {
  dispose: () => void;
  addListener: (event: string, callback: (...args: unknown[]) => void) => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
};

/** Délai avant startRecording — laisse le layout coach-only se stabiliser pour Jibri. */
const RECORDING_START_DELAY_MS = 8000;
/** Re-sync layout après join Jibri (recordingStatusChanged.on). */
const RECORDING_LAYOUT_RESYNC_DELAY_MS = 2000;

/**
 * Layout replay coach-only : setFollowMe(..., recorderOnly=true) → seul Jibri suit, pas les clientes.
 * setFollowMe(value, recorderOnly) documenté dans le handbook Jitsi External API.
 */
function applyCoachRecordingLayout(api: JitsiMeetApi, coachId: string): void {
  try {
    api.executeCommand('setTileView', false);
    api.executeCommand('pinParticipant', coachId);
    api.executeCommand('setFollowMe', true, true);
  } catch (e) {
    console.warn('[JitsiRoom] layout enregistrement coach-only', e);
  }
}

export function JitsiRoom({
  roomUrl,
  title = 'Live',
  displayName,
  email,
  isModerator,
  jwt,
  courseId,
  hideEndLive,
}: JitsiRoomProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAppFullscreen, setIsAppFullscreen] = useState(false);
  const apiRef = useRef<JitsiMeetApi | null>(null);

  const stopRecordingAndEndConference = useCallback(async () => {
    const api = apiRef.current;
    if (!api) return;
    try {
      api.executeCommand('stopRecording', 'file');
    } catch (e) {
      console.warn('[JitsiRoom] stopRecording', e);
    }
    // Laisse Jibri encaisser le stop avant de fermer la salle.
    await new Promise((r) => setTimeout(r, 1500));
    try {
      api.executeCommand('endConference');
    } catch (e) {
      console.warn('[JitsiRoom] endConference — fallback hangup', e);
      try {
        api.executeCommand('hangup');
      } catch (e2) {
        console.warn('[JitsiRoom] hangup', e2);
      }
    }
  }, []);

  /** Force les wrappers Jitsi + iframe à remplir le conteneur 16:9. */
  const jitsiFillClass =
    '[&>div]:absolute [&>div]:inset-0 [&>div]:h-full [&>div]:w-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:block [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0';

  useEffect(() => {
    const sync = () => setIsAppFullscreen(isDocumentFullscreen());
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  const toggleAppFullscreen = useCallback(async () => {
    const shell = shellRef.current;
    if (!shell) return;
    try {
      if (isDocumentFullscreen()) {
        await exitDocumentFullscreen();
      } else {
        await requestElementFullscreen(shell);
      }
    } catch (e) {
      console.warn('[JitsiRoom] plein écran navigateur indisponible', e);
    }
  }, []);

  useEffect(() => {
    setError(null);
    let cancelled = false;
    let coachId: string | undefined;
    let recordingStartTimer: ReturnType<typeof setTimeout> | null = null;
    let recordingResyncTimer: ReturnType<typeof setTimeout> | null = null;

    async function mount() {
      if (!containerRef.current) return;
      try {
        const parsed = resolveJitsiEmbedFromRoomUrl(roomUrl);
        await loadExternalApiScript(parsed.scriptOrigin);
        if (cancelled || !containerRef.current) return;

        const Ctor = window.JitsiMeetExternalAPI;
        if (!Ctor) {
          throw new Error('JitsiMeetExternalAPI indisponible après chargement du script.');
        }

        apiRef.current?.dispose();
        containerRef.current.innerHTML = '';

        apiRef.current = new Ctor(parsed.domain, {
          roomName: parsed.roomName,
          jwt,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          lang: 'fr',
          userInfo: {
            displayName: displayName.trim() || 'Participant',
            email: email.trim() || 'participant@local',
          },
          configOverwrite: buildJitsiConfigOverwrite(isModerator),
          interfaceConfigOverwrite: buildJitsiInterfaceConfigOverwrite(isModerator),
        }) as JitsiMeetApi;

        if (isModerator) {
          const api = apiRef.current;
          api.addListener('videoConferenceJoined', (event: unknown) => {
            const joined = event as { id?: string } | undefined;
            coachId = joined?.id;

            try {
              api.executeCommand('toggleModeration', true, 'audio');
            } catch (e) {
              console.warn('[JitsiRoom] toggleModeration audio — vérifier mod_av_moderation côté serveur', e);
            }

            if (coachId) {
              applyCoachRecordingLayout(api, coachId);
            }

            recordingStartTimer = setTimeout(() => {
              if (cancelled || !apiRef.current) return;
              if (coachId) {
                applyCoachRecordingLayout(apiRef.current, coachId);
              }
              apiRef.current.executeCommand('startRecording', { mode: 'file' });
            }, RECORDING_START_DELAY_MS);
          });

          api.addListener('recordingStatusChanged', (...args: unknown[]) => {
            const status = args[0] as { on?: boolean } | undefined;
            if (!status?.on || !coachId) return;
            if (recordingResyncTimer) clearTimeout(recordingResyncTimer);
            recordingResyncTimer = setTimeout(() => {
              if (cancelled || !coachId || !apiRef.current) return;
              applyCoachRecordingLayout(apiRef.current, coachId);
            }, RECORDING_LAYOUT_RESYNC_DELAY_MS);
          });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erreur lors de l’ouverture du live.');
        }
      }
    }

    void mount();

    return () => {
      cancelled = true;
      if (recordingStartTimer) clearTimeout(recordingStartTimer);
      if (recordingResyncTimer) clearTimeout(recordingResyncTimer);
      apiRef.current?.dispose();
      apiRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [roomUrl, displayName, email, isModerator, jwt]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-900">{error}</div>
    );
  }

  const showEndLive = Boolean(isModerator && courseId && !hideEndLive);

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={shellRef}
        className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-brand-ink/[0.08] bg-brand-ink/[0.04] shadow-inner ${isAppFullscreen ? 'flex-1' : ''}`}
      >
        <div className="flex items-center justify-end gap-2 border-b border-brand-ink/[0.06] bg-white/40 px-3 py-2">
          <button
            type="button"
            onClick={() => void toggleAppFullscreen()}
            className="inline-flex items-center gap-2 rounded-full border border-brand-ink/10 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-ink/70 transition hover:border-brand-accent/35 hover:text-brand-ink"
            aria-pressed={isAppFullscreen}
          >
            {isAppFullscreen ? <Minimize2 size={14} aria-hidden /> : <Maximize2 size={14} aria-hidden />}
            {isAppFullscreen ? 'Quitter plein écran' : 'Plein écran'}
          </button>
        </div>
        <p className="sr-only" role="status">
          {title}
        </p>
        <div
          ref={containerRef}
          className={
            isAppFullscreen
              ? `relative w-full min-h-0 flex-1 overflow-hidden bg-black ${jitsiFillClass}`
              : `relative mx-auto aspect-video w-full max-w-6xl overflow-hidden bg-black ${jitsiFillClass}`
          }
          aria-label="Visioconférence Jitsi"
        />
      </div>
      {showEndLive && courseId ? (
        <EndLiveControls courseId={courseId} onBeforeEnd={stopRecordingAndEndConference} />
      ) : null}
    </div>
  );
}
