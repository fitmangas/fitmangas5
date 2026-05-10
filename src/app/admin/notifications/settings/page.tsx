import { BellRing } from 'lucide-react';

import { GlassCard } from '@/components/ui/GlassCard';
import { requireAdmin } from '@/lib/auth/require-admin';
import {
  DEFAULT_NOTIFICATION_RUNTIME_SETTINGS,
  getNotificationRuntimeSettings,
} from '@/lib/notifications/settings';

const labels = {
  fr: {
    eyebrow: 'Admin',
    title: 'Paramètres notifications',
    subtitle:
      'Seuils globaux utilisés par le dispatcher. Stockage actuel : variables d’environnement Vercel.',
    emailCap: 'Cap email / jour',
    inAppCap: 'Cap in-app non lues / jour',
    quietStart: 'Début mode silence',
    quietEnd: 'Fin mode silence',
    envName: 'Variable',
    current: 'Valeur active',
    defaultValue: 'Défaut',
    editHint:
      'Pour modifier ces valeurs, changez les variables d’environnement puis redéployez.',
  },
  es: {
    eyebrow: 'Admin',
    title: 'Ajustes de notificaciones',
    subtitle:
      'Umbrales globales usados por el dispatcher. Almacenamiento actual: variables de entorno Vercel.',
    emailCap: 'Límite emails / día',
    inAppCap: 'Límite in-app no leídas / día',
    quietStart: 'Inicio modo silencio',
    quietEnd: 'Fin modo silencio',
    envName: 'Variable',
    current: 'Valor activo',
    defaultValue: 'Defecto',
    editHint:
      'Para modificar estos valores, cambie las variables de entorno y vuelva a desplegar.',
  },
} as const;

export default async function AdminNotificationSettingsPage() {
  await requireAdmin();
  const lang: 'fr' | 'es' = 'fr';
  const l = labels[lang];
  const settings = getNotificationRuntimeSettings();

  const rows = [
    {
      label: l.emailCap,
      env: 'NOTIFICATION_EMAIL_DAILY_CAP',
      current: settings.emailDailyCap,
      fallback: DEFAULT_NOTIFICATION_RUNTIME_SETTINGS.emailDailyCap,
    },
    {
      label: l.inAppCap,
      env: 'NOTIFICATION_INAPP_UNREAD_DAILY_CAP',
      current: settings.inAppUnreadDailyCap,
      fallback: DEFAULT_NOTIFICATION_RUNTIME_SETTINGS.inAppUnreadDailyCap,
    },
    {
      label: l.quietStart,
      env: 'NOTIFICATION_QUIET_HOURS_START',
      current: `${settings.quietHoursStart}h`,
      fallback: `${DEFAULT_NOTIFICATION_RUNTIME_SETTINGS.quietHoursStart}h`,
    },
    {
      label: l.quietEnd,
      env: 'NOTIFICATION_QUIET_HOURS_END',
      current: `${settings.quietHoursEnd}h`,
      fallback: `${DEFAULT_NOTIFICATION_RUNTIME_SETTINGS.quietHoursEnd}h`,
    },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">{l.eyebrow}</p>
      <h1 className="hero-signature-title mt-2 text-3xl">{l.title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-luxury-muted">{l.subtitle}</p>

      <GlassCard className="mt-8 overflow-hidden p-0">
        <div className="flex items-center gap-3 border-b border-white/35 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-luxury-violet/12 text-luxury-violet">
            <BellRing size={20} aria-hidden />
          </span>
          <p className="text-sm text-luxury-muted">{l.editHint}</p>
        </div>

        <div className="grid grid-cols-1 divide-y divide-white/35">
          <div className="hidden grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-luxury-soft md:grid">
            <span>{l.title}</span>
            <span>{l.envName}</span>
            <span>{l.current}</span>
            <span>{l.defaultValue}</span>
          </div>
          {rows.map((row) => (
            <div key={row.env} className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr] md:gap-4">
              <div>
                <p className="font-semibold text-luxury-ink">{row.label}</p>
              </div>
              <code className="break-all rounded-xl bg-white/35 px-3 py-2 text-xs text-luxury-muted">{row.env}</code>
              <p className="font-semibold text-luxury-ink">{row.current}</p>
              <p className="text-luxury-muted">{row.fallback}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </main>
  );
}
