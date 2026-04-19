'use client';

import { useEffect, useRef, useState } from 'react';
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

function buildConfigOverwrite(isModerator: boolean): Record<string, unknown> {
  const common = {
    prejoinPageEnabled: false,
    disableDeepLinking: false,
    defaultLanguage: 'fr',
  };
  if (isModerator) {
    return {
      ...common,
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      disableModeratorIndicator: false,
    };
  }
  return {
    ...common,
    startWithAudioMuted: true,
    startWithVideoMuted: false,
  };
}

function buildInterfaceConfigOverwrite(isModerator: boolean): Record<string, unknown> {
  if (!isModerator) return {};
  return {
    SHOW_JITSI_WATERMARK: false,
    SHOW_WATERMARK_FOR_GUESTS: false,
  };
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
};

export function JitsiRoom({
  roomUrl,
  title = 'Live',
  displayName,
  email,
  isModerator,
  jwt,
}: JitsiRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const apiRef = useRef<{ dispose: () => void } | null>(null);

  useEffect(() => {
    setError(null);
    let cancelled = false;

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
          configOverwrite: buildConfigOverwrite(isModerator),
          interfaceConfigOverwrite: buildInterfaceConfigOverwrite(isModerator),
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erreur lors de l’ouverture du live.');
        }
      }
    }

    void mount();

    return () => {
      cancelled = true;
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

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-brand-ink/[0.08] bg-brand-ink/[0.04] shadow-inner">
      <p className="sr-only" role="status">
        {title}
      </p>
      <div
        ref={containerRef}
        className="h-[min(72vh,800px)] w-full min-h-[420px] flex-1 overflow-hidden rounded-2xl bg-black [&_iframe]:h-full [&_iframe]:min-h-[420px] [&_iframe]:w-full"
        aria-label="Visioconférence Jitsi"
      />
    </div>
  );
}
