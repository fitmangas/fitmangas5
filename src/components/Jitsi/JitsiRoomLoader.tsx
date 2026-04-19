'use client';

import { useEffect, useState } from 'react';
import { JitsiRoom } from '@/components/Jitsi/JitsiRoom';

type Props = {
  courseId: string;
  roomUrl: string;
  title: string;
  displayName: string;
  email: string;
  isModerator: boolean;
};

type TokenResponse = {
  token: string;
};

export function JitsiRoomLoader({ courseId, roomUrl, title, displayName, email, isModerator }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setToken(null);

    async function loadToken() {
      try {
        const res = await fetch('/api/jitsi/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        });
        const json = (await res.json()) as TokenResponse | { error: string };
        if (!res.ok) {
          const message = 'error' in json ? json.error : 'Token Jitsi indisponible.';
          throw new Error(message);
        }
        if (!('token' in json)) {
          throw new Error('Reponse token invalide.');
        }
        if (cancelled) return;
        setToken(json.token);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Impossible de charger le token live.');
        }
      }
    }

    void loadToken();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-900">{error}</div>;
  }

  if (!token) {
    return (
      <div className="rounded-2xl border border-brand-ink/10 bg-white px-4 py-6 text-sm text-brand-ink/70">
        Connexion securisee au live...
      </div>
    );
  }

  return (
    <JitsiRoom
      roomUrl={roomUrl}
      title={title}
      displayName={displayName}
      email={email}
      isModerator={isModerator}
      jwt={token}
    />
  );
}
