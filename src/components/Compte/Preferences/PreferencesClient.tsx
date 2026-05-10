'use client';

import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState, useTransition, type ReactNode } from 'react';

import { GlassCard } from '@/components/ui/GlassCard';
import { PushOptIn } from '@/components/Notifications/PushOptIn';
import type {
  ProfilePreferencesUpdate,
  UpdateNotificationPayload,
} from '@/app/compte/preferences/actions';
import {
  updateNotificationPreferences,
  updateProfilePreferences,
} from '@/app/compte/preferences/actions';
import type { NotificationPreferencesRow } from '@/lib/notifications/types';

import type { PreferencesLang } from './i18n';
import { preferencesLabels } from './i18n';
import { RadioGroup } from './RadioGroup';
import { SaveToast } from './SaveToast';
import { TimezoneSelector } from './TimezoneSelector';
import { Toggle } from './Toggle';

export type PreferencesProfileInitial = {
  preferred_locale: 'fr' | 'es';
  display_timezone: string;
  display_timezone_manual_locked: boolean;
  marketing_email_opt_in: boolean;
  marketing_email_opt_in_at: string | null;
};

type Props = {
  userId: string;
  initialPrefs: Omit<NotificationPreferencesRow, 'user_id'>;
  initialProfile: PreferencesProfileInitial;
  lang: PreferencesLang;
};

export function PreferencesClient({ userId, initialPrefs, initialProfile, lang }: Props) {
  const router = useRouter();
  const l = preferencesLabels[lang];

  const [prefs, setPrefs] = useState(initialPrefs);
  const [preferredLocale, setPreferredLocale] = useState(initialProfile.preferred_locale);
  const [displayTimezone, setDisplayTimezone] = useState(initialProfile.display_timezone);
  const [marketingOptIn, setMarketingOptIn] = useState(initialProfile.marketing_email_opt_in);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [, startTransition] = useTransition();

  const pendingPrefs = useRef<UpdateNotificationPayload>({});
  const pendingProfile = useRef<ProfilePreferencesUpdate>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = useCallback((message: string) => {
    if (toastTimeoutRef.current !== null) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToastMessage(message);
    setToastVisible(true);
    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
      toastTimeoutRef.current = null;
    }, 2000);
  }, []);

  const runSave = useCallback(
    (p: UpdateNotificationPayload, pr: ProfilePreferencesUpdate) => {
      startTransition(() => {
        void (async () => {
          try {
            if (Object.keys(p).length) await updateNotificationPreferences(p);
            if (Object.keys(pr).length) await updateProfilePreferences(pr);
            showFeedback(l.saveSuccess);
          } catch {
            showFeedback(l.saveError);
            router.refresh();
          }
        })();
      });
    },
    [l.saveError, l.saveSuccess, router, showFeedback, startTransition],
  );

  const scheduleFlush = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const p = { ...pendingPrefs.current };
      const pr = { ...pendingProfile.current };
      pendingPrefs.current = {};
      pendingProfile.current = {};
      runSave(p, pr);
    }, 300);
  }, [runSave]);

  const queuePrefs = useCallback(
    (partial: UpdateNotificationPayload) => {
      pendingPrefs.current = { ...pendingPrefs.current, ...partial };
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const queueProfile = useCallback(
    (partial: ProfilePreferencesUpdate) => {
      pendingProfile.current = { ...pendingProfile.current, ...partial };
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const flushPendingSilently = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const p = { ...pendingPrefs.current };
    const pr = { ...pendingProfile.current };
    pendingPrefs.current = {};
    pendingProfile.current = {};
    if (Object.keys(p).length) await updateNotificationPreferences(p);
    if (Object.keys(pr).length) await updateProfilePreferences(pr);
  }, []);

  /** Le flush debouncé est déclenché dans TimezoneSelector avant cet appel. */
  const handleTimezoneSave = useCallback(
    async (iana: string) => {
      try {
        await updateProfilePreferences({ display_timezone: iana });
        setDisplayTimezone(iana);
        showFeedback(l.saveSuccess);
      } catch {
        showFeedback(l.saveError);
        router.refresh();
      }
    },
    [l.saveError, l.saveSuccess, router, showFeedback],
  );

  function setCoursesInApp(v: boolean) {
    setPrefs((s) => ({ ...s, courses_inapp_enabled: v }));
    queuePrefs({ courses_inapp_enabled: v });
  }
  function setCoursesEmail(v: boolean) {
    setPrefs((s) => ({ ...s, courses_email_enabled: v }));
    queuePrefs({ courses_email_enabled: v });
  }
  function setContentInApp(v: boolean) {
    setPrefs((s) => ({ ...s, content_inapp_enabled: v }));
    queuePrefs({ content_inapp_enabled: v });
  }
  function setContentEmail(v: boolean) {
    setPrefs((s) => ({ ...s, content_email_enabled: v }));
    queuePrefs({ content_email_enabled: v });
  }
  function setShopInApp(v: boolean) {
    setPrefs((s) => ({ ...s, shop_inapp_enabled: v }));
    queuePrefs({ shop_inapp_enabled: v });
  }
  function setShopEmail(v: boolean) {
    setPrefs((s) => ({ ...s, shop_email_enabled: v }));
    queuePrefs({ shop_email_enabled: v });
  }
  function setCommunityInApp(v: boolean) {
    setPrefs((s) => ({ ...s, community_inapp_enabled: v }));
    queuePrefs({ community_inapp_enabled: v });
  }
  function setCommunityEmail(v: boolean) {
    setPrefs((s) => ({ ...s, community_email_enabled: v }));
    queuePrefs({ community_email_enabled: v });
  }
  function setSilence(v: boolean) {
    setPrefs((s) => ({ ...s, silence_mode_enabled: v }));
    queuePrefs({ silence_mode_enabled: v });
  }
  function setDigest(v: NotificationPreferencesRow['digest_frequency']) {
    setPrefs((s) => ({ ...s, digest_frequency: v }));
    queuePrefs({ digest_frequency: v });
  }
  function setLocale(next: 'fr' | 'es') {
    setPreferredLocale(next);
    queueProfile({ preferred_locale: next });
  }
  function setMarketing(v: boolean) {
    setMarketingOptIn(v);
    queueProfile({ marketing_email_opt_in: v });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-16">
      <SaveToast visible={toastVisible} message={toastMessage} />

      <header className="space-y-2">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-luxury-ink md:text-4xl">
          {l.pageTitle}
        </h1>
        <p className="text-base text-luxury-muted">{l.pageSubtitle}</p>
      </header>

      <GlassCard className="space-y-8 p-6 md:p-8">
        <div>
          <h2 className="font-serif text-xl font-semibold text-luxury-ink">{l.notificationsTitle}</h2>
        </div>

        <CategoryBlock title={l.categoryCourses}>
          <Toggle
            id="courses-inapp"
            label={l.inApp}
            checked={prefs.courses_inapp_enabled}
            onChange={setCoursesInApp}
          />
          <Toggle
            id="courses-email"
            label={l.email}
            checked={prefs.courses_email_enabled}
            onChange={setCoursesEmail}
          />
        </CategoryBlock>

        <CategoryBlock title={l.categoryContent}>
          <Toggle
            id="content-inapp"
            label={l.inApp}
            checked={prefs.content_inapp_enabled}
            onChange={setContentInApp}
          />
          <Toggle
            id="content-email"
            label={l.email}
            checked={prefs.content_email_enabled}
            onChange={setContentEmail}
          />
        </CategoryBlock>

        <CategoryBlock title={l.categoryShop}>
          <Toggle id="shop-inapp" label={l.inApp} checked={prefs.shop_inapp_enabled} onChange={setShopInApp} />
          <Toggle id="shop-email" label={l.email} checked={prefs.shop_email_enabled} onChange={setShopEmail} />
        </CategoryBlock>

        <CategoryBlock title={l.categoryCommunity}>
          <Toggle
            id="community-inapp"
            label={l.inApp}
            checked={prefs.community_inapp_enabled}
            onChange={setCommunityInApp}
          />
          <Toggle
            id="community-email"
            label={l.email}
            checked={prefs.community_email_enabled}
            onChange={setCommunityEmail}
          />
        </CategoryBlock>

        <div className="rounded-xl border border-white/40 bg-white/25 p-4">
          <div className="flex gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-luxury-muted" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-luxury-muted">{l.essentialsTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-luxury-muted/90">{l.essentialsBody}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      <PushOptIn
        userId={userId}
        lang={lang}
        initialEnabled={
          prefs.courses_push_enabled ||
          prefs.content_push_enabled ||
          prefs.shop_push_enabled ||
          prefs.community_push_enabled
        }
      />

      <GlassCard className="space-y-4 p-6 md:p-8">
        <h2 className="font-serif text-xl font-semibold text-luxury-ink">{l.silenceTitle}</h2>
        <Toggle
          id="silence-mode"
          label={l.silenceLabel}
          description={l.silenceBody}
          checked={prefs.silence_mode_enabled}
          onChange={setSilence}
        />
      </GlassCard>

      <GlassCard className="space-y-4 p-6 md:p-8">
        <h2 className="font-serif text-xl font-semibold text-luxury-ink">{l.digestTitle}</h2>
        <RadioGroup
          name="digest_frequency"
          value={prefs.digest_frequency}
          onChange={setDigest}
          options={[
            { value: 'off', label: l.digestOff },
            { value: 'daily', label: l.digestDaily },
            { value: 'weekly', label: l.digestWeekly },
          ]}
        />
      </GlassCard>

      <GlassCard className="space-y-6 p-6 md:p-8">
        <h2 className="font-serif text-xl font-semibold text-luxury-ink">{l.languageTimezoneTitle}</h2>

        <div>
          <p className="mb-3 text-sm font-semibold text-luxury-ink">{l.languageLabel}</p>
          <div className="flex flex-wrap gap-2">
            {(['fr', 'es'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  preferredLocale === code
                    ? 'border-luxury-emerald/50 bg-luxury-emerald/15 text-luxury-ink'
                    : 'border-white/50 bg-white/35 text-luxury-muted hover:border-white/70'
                }`}
              >
                {code === 'fr' ? l.languageFr : l.languageEs}
              </button>
            ))}
          </div>
        </div>

        <TimezoneSelector
          currentTimezone={displayTimezone}
          labels={{
            timezoneLabel: l.timezoneLabel,
            timezoneEdit: l.timezoneEdit,
            timezoneSave: l.timezoneSave,
            timezoneCancel: l.timezoneCancel,
          }}
          flushPending={flushPendingSilently}
          onSave={handleTimezoneSave}
        />
      </GlassCard>

      <GlassCard className="space-y-4 p-6 md:p-8">
        <h2 className="font-serif text-xl font-semibold text-luxury-ink">{l.marketingTitle}</h2>
        <Toggle
          id="marketing-email"
          label={l.marketingLabel}
          description={l.marketingBody}
          checked={marketingOptIn}
          onChange={setMarketing}
        />
      </GlassCard>
    </div>
  );
}

function CategoryBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-white/30 pb-6 last:border-0 last:pb-0">
      <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-luxury-muted">{title}</p>
      <div className="space-y-5">{children}</div>
    </div>
  );
}
