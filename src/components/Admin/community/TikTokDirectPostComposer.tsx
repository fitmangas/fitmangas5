'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import type { TikTokDirectPostSettings } from '@/lib/admin/social-comms';
import { EMPTY_TIKTOK_DIRECT_POST } from '@/lib/admin/social-comms';
import { getTikTokCreatorInfoAction } from '@/app/admin/community/actions';

const MUSIC_URL = 'https://www.tiktok.com/legal/page/global/music-usage-confirmation/en';
const BC_POLICY_URL = 'https://www.tiktok.com/legal/page/global/bc-policy/en';

const PRIVACY_LABELS: Record<string, string> = {
  PUBLIC_TO_EVERYONE: 'Public',
  MUTUAL_FOLLOW_FRIENDS: 'Amis',
  FOLLOWER_OF_CREATOR: 'Abonnés',
  SELF_ONLY: 'Seulement moi',
};

type CreatorInfo = {
  nickname: string;
  avatarUrl: string | null;
  privacyLevelOptions: string[];
  maxVideoPostDurationSec: number;
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
};

type Props = {
  videoUrl: string | null;
  caption: string;
  initial: TikTokDirectPostSettings | null;
  onSave: (settings: TikTokDirectPostSettings) => Promise<void> | void;
};

export function TikTokDirectPostComposer({ videoUrl, caption, initial, onSave }: Props) {
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creator, setCreator] = useState<CreatorInfo | null>(null);
  const [privacyLevel, setPrivacyLevel] = useState<string>('');
  const [title, setTitle] = useState(initial?.titleOverride || caption || '');
  const [allowComment, setAllowComment] = useState(initial?.allowComment ?? false);
  const [allowDuet, setAllowDuet] = useState(initial?.allowDuet ?? false);
  const [allowStitch, setAllowStitch] = useState(initial?.allowStitch ?? false);
  const [commercialDisclosure, setCommercialDisclosure] = useState(initial?.commercialDisclosure ?? false);
  const [brandOrganic, setBrandOrganic] = useState(initial?.brandOrganic ?? false);
  const [brandContent, setBrandContent] = useState(initial?.brandContent ?? false);
  const [musicUsageConsent, setMusicUsageConsent] = useState(initial?.musicUsageConsent ?? false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const loadCreator = () => {
    setLoading(true);
    setError(null);
    startTransition(() => {
      void getTikTokCreatorInfoAction().then((res) => {
        setLoading(false);
        if (!res.ok) {
          setCreator(null);
          setError(res.error);
          return;
        }
        setCreator(res.data);
        setPrivacyLevel('');
      });
    });
  };

  useEffect(() => {
    loadCreator();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  useEffect(() => {
    if (!initial?.titleOverride) setTitle(caption || '');
  }, [caption, initial?.titleOverride]);

  const cannotPost =
    !creator ||
    creator.privacyLevelOptions.length === 0 ||
    creator.maxVideoPostDurationSec === 0;

  const disclosureIncomplete = commercialDisclosure && !brandOrganic && !brandContent;
  const brandedPrivateBlocked = brandContent && privacyLevel === 'SELF_ONLY';

  const disableReason = useMemo(() => {
    if (loading) return 'Chargement des infos créateur TikTok…';
    if (error) return error;
    if (cannotPost) return 'Ce compte TikTok ne peut pas publier pour le moment. Réessaie plus tard.';
    if (!privacyLevel) return 'Choisis qui peut voir la publication (aucune valeur par défaut).';
    if (disclosureIncomplete) {
      return 'You need to indicate if your content promotes yourself, a third party, or both.';
    }
    if (brandedPrivateBlocked) {
      return 'Branded content visibility cannot be set to private.';
    }
    if (!musicUsageConsent) return 'Coche le consentement Music Usage Confirmation.';
    return null;
  }, [loading, error, cannotPost, privacyLevel, disclosureIncomplete, brandedPrivateBlocked, musicUsageConsent]);

  const labelHint = commercialDisclosure
    ? brandContent || (brandOrganic && brandContent)
      ? "Your photo/video will be labeled as 'Paid partnership'"
      : brandOrganic
        ? "Your photo/video will be labeled as 'Promotional content'"
        : null
    : null;

  const consentText = brandContent ? (
    <>
      By posting, you agree to TikTok&apos;s{' '}
      <a href={BC_POLICY_URL} target="_blank" rel="noreferrer" className="underline">
        Branded Content Policy
      </a>{' '}
      and{' '}
      <a href={MUSIC_URL} target="_blank" rel="noreferrer" className="underline">
        Music Usage Confirmation
      </a>
    </>
  ) : (
    <>
      By posting, you agree to TikTok&apos;s{' '}
      <a href={MUSIC_URL} target="_blank" rel="noreferrer" className="underline">
        Music Usage Confirmation
      </a>
    </>
  );

  const handleSave = () => {
    if (disableReason) return;
    const settings: TikTokDirectPostSettings = {
      ...EMPTY_TIKTOK_DIRECT_POST,
      privacyLevel,
      allowComment,
      allowDuet,
      allowStitch,
      commercialDisclosure,
      brandOrganic: commercialDisclosure ? brandOrganic : false,
      brandContent: commercialDisclosure ? brandContent : false,
      musicUsageConsent: true,
      titleOverride: title.trim() || null,
      consentedAt: new Date().toISOString(),
    };
    startTransition(() => {
      void Promise.resolve(onSave(settings)).then(() => {
        setSavedMsg('Paramètres TikTok enregistrés — publication possible (après audit public).');
      });
    });
  };

  return (
    <div className="mt-3 rounded-2xl border border-[#E8D9C8] bg-[#FFFAF5] p-3 text-xs text-luxury-ink">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a2e1a]">
          TikTok Direct Post — consentement
        </p>
        <button
          type="button"
          className="rounded-full border border-[#E8D9C8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-luxury-soft"
          onClick={loadCreator}
          disabled={pending || loading}
        >
          Retry infos
        </button>
      </div>

      {creator ? (
        <div className="mt-2 flex items-center gap-2">
          {creator.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={creator.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8D9C8] text-[10px]">TT</div>
          )}
          <div>
            <p className="font-semibold">@{creator.nickname}</p>
            <p className="text-[10px] text-luxury-soft">
              Durée max : {creator.maxVideoPostDurationSec}s
            </p>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-[11px] text-red-700">{error}</p> : null}
      {cannotPost && !error ? (
        <p className="mt-2 text-[11px] text-amber-800">
          Publication bloquée (quota / options vides). Clique Retry.
        </p>
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-[140px_1fr]">
        <div className="relative mx-auto aspect-[9/16] w-[120px] overflow-hidden rounded-xl bg-black">
          {videoUrl ? (
            <video src={videoUrl} controls playsInline className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-2 text-center text-[10px] text-white/70">
              MP4 manquant
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <p className="truncate text-[9px] text-white/90">@{creator?.nickname || 'tiktok'}</p>
            <p className="line-clamp-2 text-[9px] text-white">{title || caption}</p>
          </div>
        </div>

        <div className="space-y-2.5">
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">
              Titre / légende
            </span>
            <textarea
              className="mt-1 w-full rounded-xl border border-[#E8D9C8] bg-white px-2.5 py-2 text-xs"
              rows={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">
              Qui peut voir *
            </span>
            <select
              className="mt-1 w-full rounded-xl border border-[#E8D9C8] bg-white px-2.5 py-2 text-xs"
              value={privacyLevel}
              onChange={(e) => {
                const next = e.target.value;
                if (next === 'SELF_ONLY' && brandContent) {
                  setBrandContent(false);
                }
                setPrivacyLevel(next);
              }}
            >
              <option value="">— Choisir —</option>
              {(creator?.privacyLevelOptions || []).map((opt) => {
                const disabled = brandContent && opt === 'SELF_ONLY';
                return (
                  <option
                    key={opt}
                    value={opt}
                    disabled={disabled}
                    title={
                      disabled ? 'Branded content visibility cannot be set to private.' : undefined
                    }
                  >
                    {PRIVACY_LABELS[opt] || opt}
                    {disabled ? ' (indisponible)' : ''}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="flex flex-wrap gap-3">
            <label
              className={`inline-flex items-center gap-1.5 ${creator?.commentDisabled ? 'opacity-40' : ''}`}
              title={creator?.commentDisabled ? 'Commentaires désactivés sur le compte TikTok' : undefined}
            >
              <input
                type="checkbox"
                checked={allowComment}
                disabled={Boolean(creator?.commentDisabled)}
                onChange={(e) => setAllowComment(e.target.checked)}
              />
              Allow Comment
            </label>
            <label
              className={`inline-flex items-center gap-1.5 ${creator?.duetDisabled ? 'opacity-40' : ''}`}
              title={creator?.duetDisabled ? 'Duet désactivé sur le compte TikTok' : undefined}
            >
              <input
                type="checkbox"
                checked={allowDuet}
                disabled={Boolean(creator?.duetDisabled)}
                onChange={(e) => setAllowDuet(e.target.checked)}
              />
              Allow Duet
            </label>
            <label
              className={`inline-flex items-center gap-1.5 ${creator?.stitchDisabled ? 'opacity-40' : ''}`}
              title={creator?.stitchDisabled ? 'Stitch désactivé sur le compte TikTok' : undefined}
            >
              <input
                type="checkbox"
                checked={allowStitch}
                disabled={Boolean(creator?.stitchDisabled)}
                onChange={(e) => setAllowStitch(e.target.checked)}
              />
              Allow Stitch
            </label>
          </div>

          <label className="inline-flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={commercialDisclosure}
              onChange={(e) => {
                setCommercialDisclosure(e.target.checked);
                if (!e.target.checked) {
                  setBrandOrganic(false);
                  setBrandContent(false);
                }
              }}
            />
            Disclose commercial content
          </label>

          {commercialDisclosure ? (
            <div className="space-y-1.5 rounded-xl border border-[#E8D9C8]/80 bg-white/70 p-2">
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={brandOrganic}
                  onChange={(e) => setBrandOrganic(e.target.checked)}
                />
                Your brand
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={brandContent}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setBrandContent(on);
                    if (on && privacyLevel === 'SELF_ONLY') setPrivacyLevel('');
                  }}
                />
                Branded content
              </label>
              {labelHint ? <p className="text-[10px] text-luxury-soft">{labelHint}</p> : null}
            </div>
          ) : null}

          <label className="flex items-start gap-1.5">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={musicUsageConsent}
              onChange={(e) => setMusicUsageConsent(e.target.checked)}
            />
            <span>{consentText}</span>
          </label>

          <button
            type="button"
            disabled={Boolean(disableReason) || pending}
            title={disableReason || undefined}
            onClick={handleSave}
            className="rounded-full bg-[#C45D3E] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enregistrer paramètres TikTok
          </button>
          {disableReason ? <p className="text-[10px] text-amber-800">{disableReason}</p> : null}
          {savedMsg ? <p className="text-[10px] text-emerald-800">{savedMsg}</p> : null}
          <p className="text-[10px] text-luxury-soft">
            Après enregistrement, le cron / « Publier » envoie vers TikTok. Le public Direct Post
            nécessite l’audit TikTok (sinon inbox / privé).
          </p>
        </div>
      </div>
    </div>
  );
}
