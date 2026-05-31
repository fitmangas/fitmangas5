'use client';

import { useCallback, useRef, useState, useTransition } from 'react';

import { updateProfilePreferences, type ProfilePreferencesUpdate } from '@/app/compte/preferences/actions';
import { GlassCard } from '@/components/ui/GlassCard';
import type { PreferencesLang } from '@/components/Compte/Preferences/i18n';
import { preferencesLabels } from '@/components/Compte/Preferences/i18n';
import { SaveToast } from '@/components/Compte/Preferences/SaveToast';
import { TimezoneSelector } from '@/components/Compte/Preferences/TimezoneSelector';

type Props = {
  initialLocale: 'fr' | 'es';
  initialTimezone: string;
  timezoneManualLocked: boolean;
  lang: PreferencesLang;
};

export function ProfileLanguageTimezoneCard({
  initialLocale,
  initialTimezone,
  timezoneManualLocked: initialLocked,
  lang,
}: Props) {
  const l = preferencesLabels[lang];
  const [preferredLocale, setPreferredLocale] = useState(initialLocale);
  const [displayTimezone, setDisplayTimezone] = useState(initialTimezone);
  const [timezoneManualLocked, setTimezoneManualLocked] = useState(initialLocked);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const pendingProfile = useRef<ProfilePreferencesUpdate>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  const showFeedback = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }, []);

  const flushProfile = useCallback(
    (pr: ProfilePreferencesUpdate) => {
      startTransition(() => {
        void (async () => {
          try {
            await updateProfilePreferences(pr);
            showFeedback(l.saveSuccess);
          } catch {
            showFeedback(l.saveError);
          }
        })();
      });
    },
    [l.saveError, l.saveSuccess, showFeedback, startTransition],
  );

  const queueLocale = (next: 'fr' | 'es') => {
    setPreferredLocale(next);
    pendingProfile.current = { preferred_locale: next };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const pr = { ...pendingProfile.current };
      pendingProfile.current = {};
      flushProfile(pr);
    }, 300);
  };

  const handleTimezoneSave = async (iana: string) => {
    try {
      await updateProfilePreferences({ display_timezone: iana });
      setDisplayTimezone(iana);
      setTimezoneManualLocked(true);
      showFeedback(l.saveSuccess);
    } catch {
      showFeedback(l.saveError);
    }
  };

  return (
    <GlassCard id="langue" className="scroll-mt-28 flex h-full flex-col p-4 shadow-sm">
      <SaveToast visible={toastVisible} message={toastMessage} />
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{l.languageTimezoneTitle}</p>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-luxury-soft">{l.languageLabel}</p>
      <div className="mt-2 flex gap-2">
        {(['fr', 'es'] as const).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => queueLocale(code)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              preferredLocale === code
                ? 'border-luxury-emerald/45 bg-white/85 text-luxury-ink shadow-sm'
                : 'border-white/55 bg-white/40 text-luxury-muted hover:bg-white/70'
            }`}
          >
            {code === 'fr' ? l.languageFr : l.languageEs}
          </button>
        ))}
      </div>
      <div className="mt-4 border-t border-white/35 pt-3">
        <TimezoneSelector
          currentTimezone={displayTimezone}
          labels={{
            timezoneLabel: l.timezoneLabel,
            timezoneStatus: timezoneManualLocked ? l.timezoneManual : l.timezoneAuto,
            timezoneEdit: l.timezoneEdit,
            timezoneSave: l.timezoneSave,
            timezoneCancel: l.timezoneCancel,
          }}
          onSave={handleTimezoneSave}
        />
      </div>
    </GlassCard>
  );
}
