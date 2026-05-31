'use client';

import { Bell, BellOff } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';

import {
  deletePushSubscription,
  savePushSubscription,
  updateNotificationPreferences,
} from '@/app/compte/preferences/actions';
import { GlassCard } from '@/components/ui/GlassCard';

type Lang = 'fr' | 'es';

type Props = {
  lang: Lang;
  userId: string;
  initialEnabled: boolean;
  compact?: boolean;
};

const labels = {
  fr: {
    title: 'Notifications push',
    body: 'Recevez les rappels importants dans votre navigateur, même quand FitMangas est fermé.',
    enable: 'Activer les notifications push',
    disable: 'Désactiver sur cet appareil',
    enabled: 'Notifications push activées sur cet appareil.',
    denied: 'Vous avez refusé les notifications push. Le navigateur ne proposera plus la demande automatiquement.',
    unsupported: 'Votre navigateur ne prend pas en charge les notifications push.',
    missingKey: 'Clé VAPID publique manquante. Ajoutez NEXT_PUBLIC_VAPID_PUBLIC_KEY.',
    error: 'Impossible d’activer les notifications push. Réessayez plus tard.',
  },
  es: {
    title: 'Notificaciones push',
    body: 'Recibe recordatorios importantes en tu navegador, incluso cuando FitMangas esté cerrado.',
    enable: 'Activar las notificaciones push',
    disable: 'Desactivar en este dispositivo',
    enabled: 'Notificaciones push activadas en este dispositivo.',
    denied: 'Has rechazado las notificaciones push. El navegador no volverá a mostrar la solicitud automáticamente.',
    unsupported: 'Tu navegador no admite notificaciones push.',
    missingKey: 'Falta la clave VAPID pública. Añade NEXT_PUBLIC_VAPID_PUBLIC_KEY.',
    error: 'No se pudieron activar las notificaciones push. Inténtalo más tarde.',
  },
} as const;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function extractKeys(subscription: PushSubscription) {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!p256dh || !auth) {
    throw new Error('Subscription keys missing.');
  }
  return { p256dh, auth };
}

export function PushOptIn({ lang, userId, initialEnabled, compact = false }: Props) {
  const l = labels[lang];
  const [enabled, setEnabled] = useState(initialEnabled);
  const [status, setStatus] = useState<'idle' | 'enabled' | 'denied' | 'unsupported' | 'missing-key' | 'error'>(
    initialEnabled ? 'enabled' : 'idle',
  );
  const [isPending, startTransition] = useTransition();

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const storageKey = useMemo(() => `fitmangas:push-denied:${userId}`, [userId]);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setStatus('unsupported');
      return;
    }
    if (window.localStorage.getItem(storageKey) === '1' || Notification.permission === 'denied') {
      setStatus('denied');
    }
  }, [storageKey]);

  const enablePush = useCallback(() => {
    startTransition(() => {
      void (async () => {
        try {
          if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
            setStatus('unsupported');
            return;
          }
          if (!publicKey) {
            setStatus('missing-key');
            return;
          }

          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            window.localStorage.setItem(storageKey, '1');
            setStatus('denied');
            return;
          }

          const registration = await navigator.serviceWorker.register('/sw.js');
          const existing = await registration.pushManager.getSubscription();
          const subscription =
            existing ??
            (await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicKey),
            }));

          const keys = extractKeys(subscription);
          await savePushSubscription({
            endpoint: subscription.endpoint,
            keys,
            user_agent: navigator.userAgent,
          });
          await updateNotificationPreferences({
            courses_push_enabled: true,
            content_push_enabled: true,
            shop_push_enabled: true,
            community_push_enabled: true,
          });

          setEnabled(true);
          setStatus('enabled');
        } catch {
          setStatus('error');
        }
      })();
    });
  }, [publicKey, storageKey]);

  const disablePush = useCallback(() => {
    startTransition(() => {
      void (async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration('/sw.js');
          const subscription = await registration?.pushManager.getSubscription();
          if (subscription) {
            await deletePushSubscription(subscription.endpoint);
            await subscription.unsubscribe();
          }
          await updateNotificationPreferences({
            courses_push_enabled: false,
            content_push_enabled: false,
            shop_push_enabled: false,
            community_push_enabled: false,
          });
          setEnabled(false);
          setStatus('idle');
        } catch {
          setStatus('error');
        }
      })();
    });
  }, []);

  const message =
    status === 'enabled'
      ? l.enabled
      : status === 'denied'
        ? l.denied
        : status === 'unsupported'
          ? l.unsupported
          : status === 'missing-key'
            ? l.missingKey
            : status === 'error'
              ? l.error
              : null;

  if (compact) {
    return (
      <GlassCard className="flex h-full flex-col justify-between gap-3 rounded-2xl border border-luxury-violet/15 p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            {enabled ? <Bell className="h-4 w-4 text-luxury-violet" aria-hidden /> : <BellOff className="h-4 w-4 text-luxury-muted" aria-hidden />}
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-luxury-ink">{l.title}</h3>
          </div>
          <p className="mt-2 text-xs leading-snug text-luxury-muted">{l.body}</p>
          {message ? <p className="mt-1 text-[10px] text-luxury-muted">{message}</p> : null}
        </div>
        <button
          type="button"
          disabled={isPending || status === 'unsupported' || status === 'denied' || status === 'missing-key'}
          onClick={enabled ? disablePush : enablePush}
          className="w-full rounded-xl border border-luxury-violet/25 bg-luxury-violet/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-luxury-ink transition hover:bg-luxury-violet/15 disabled:opacity-50"
        >
          {enabled ? l.disable : l.enable}
        </button>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="space-y-4 border border-luxury-violet/15 p-5">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-luxury-violet/12 text-luxury-violet">
          {enabled ? <Bell className="h-5 w-5" aria-hidden /> : <BellOff className="h-5 w-5" aria-hidden />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-luxury-ink">{l.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-luxury-muted">{l.body}</p>
          {message ? <p className="mt-2 text-xs leading-relaxed text-luxury-muted">{message}</p> : null}
        </div>
      </div>

      <button
        type="button"
        disabled={isPending || status === 'unsupported' || status === 'denied' || status === 'missing-key'}
        onClick={enabled ? disablePush : enablePush}
        className="rounded-full border border-luxury-violet/30 bg-luxury-violet/10 px-4 py-2 text-sm font-semibold text-luxury-ink transition hover:bg-luxury-violet/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enabled ? l.disable : l.enable}
      </button>
    </GlassCard>
  );
}
