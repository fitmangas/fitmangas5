'use client';

import Player from '@vimeo/player';
import { useEffect, useMemo, useRef } from 'react';

import { createClient } from '@/lib/supabase/client';

type Props = {
  embedUrl: string;
  title: string;
  /** Si absent : iframe simple (pas de suivi position). */
  recordingId?: string | null;
  initialSeconds?: number;
};

function normalizeVimeoIframeSrc(url: string): string {
  return url.trim().replace(/&amp;/g, '&');
}

function withVimeoApi(url: string): string {
  try {
    const u = new URL(normalizeVimeoIframeSrc(url));
    u.searchParams.set('api', '1');
    return u.toString();
  } catch {
    return normalizeVimeoIframeSrc(url);
  }
}

export function VimeoReplayWithResume({ embedUrl, title, recordingId, initialSeconds = 0 }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastSaved = useRef(0);
  const src = useMemo(() => withVimeoApi(embedUrl), [embedUrl]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !recordingId) return;

    let player: Player | null = null;
    let cancelled = false;

    void (async () => {
      try {
        player = new Player(iframe);
        await player.ready();
        if (cancelled) return;
        if (initialSeconds >= 3) {
          await player.setCurrentTime(initialSeconds);
        }

        const persist = (seconds: number) => {
          const sec = Math.floor(seconds);
          if (sec - lastSaved.current < 10) return;
          lastSaved.current = sec;
          void createClient().rpc('upsert_replay_progress', {
            p_recording_id: recordingId,
            p_seconds: sec,
          });
        };

        player.on('timeupdate', (e: { seconds: number }) => {
          persist(e.seconds);
        });
        player.on('pause', () => {
          void player?.getCurrentTime().then((t) => persist(t));
        });
      } catch {
        /* lecteur sans API */
      }
    })();

    return () => {
      cancelled = true;
      try {
        player?.destroy();
      } catch {
        /* noop */
      }
    };
  }, [recordingId, initialSeconds, src]);

  if (!recordingId) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-brand-ink/10 bg-black shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
        <iframe
          src={normalizeVimeoIframeSrc(embedUrl)}
          title={title}
          className="h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-brand-ink/10 bg-black shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className="h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
