'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  CalendarClock,
  Check,
  CheckCircle2,
  CircleHelp,
  Copy,
  Download,
  Eye,
  Film,
  CalendarDays,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

import {
  attachSocialEditedVideoAction,
  createManualSocialPostAction,
  deleteSocialPostAction,
  disconnectMetaAction,
  finalizeWeekPlanAction,
  generateConseilSeriesPostAction,
  generateNextPostAction,
  generateSocialImageAction,
  generateSpanishVariantAction,
  initWeekPlanAction,
  getMetaConnectUrlAction,
  markAllSocialPostsReadyAction,
  polishExistingSocialPostsAction,
  publishFacebookMirrorNowAction,
  publishSocialPostNowAction,
  markSocialPostManualSentAction,
  refineSocialImageAction,
  regenerateOneSocialPostAction,
  resetAlejandraDoubleAction,
  saveAlejandraDoubleAction,
  saveMetaConnectionManualAction,
  scheduleSocialPostAction,
  requeueFailedWeekPlanAction,
  toggleLinkedInAdaptationAction,
  trainAlejandraPhotaAction,
  refreshAlejandraPhotaStatusAction,
  updateSocialPostCaptionAction,
  updateSocialPostFacebookMirrorAction,
  updateSocialPostImageAction,
  updateSocialPostImageFeedbackAction,
  updateSocialPostOverlayAction,
  updateSocialPostParisScheduleAction,
  updateSocialPostReelBriefAction,
  updateSocialPostStatusAction,
  updateSocialPostThemeAction,
} from '@/app/admin/community/actions';
import {
  analyzeCaptionForPost,
  captionForPublish,
  CM_STRATEGY_NOTES,
  formatBestHours,
  monthGridDays,
  SOCIAL_CM_GUIDELINES,
  statusLabelForPost,
  statusOptionsForFormat,
} from '@/lib/admin/social-cm-playbook';
import { allowedParisHours, formatParisDateTime, parseParisSchedule } from '@/lib/admin/social-paris-time';
import { downloadSocialPostImage, renderSocialPostDataUrl } from '@/lib/admin/social-image-render';
import {
  buildClaudeCodeReelPrompt,
  copyTextFromUserGesture,
} from '@/lib/admin/reel-prompt-reference';
import { resolveGenerationNetworks, weekPlanSummary } from '@/lib/admin/social-week-planner';
import type { AlejandraDoubleProfile } from '@/lib/admin/alejandra-double';
import {
  localDayKey,
  facebookPermalinkUrl,
  SOCIAL_LIBRARY_IMAGES,
  SOCIAL_LOCALE_LABELS,
  SOCIAL_NETWORK_COLORS,
  SOCIAL_NETWORK_LABELS,
  socialImageProviderLabel,
  startOfWeekMonday,
  type MetaSocialConnection,
  type SocialCommsBoard,
  type SocialLocale,
  type SocialNetwork,
  type SocialPost,
} from '@/lib/admin/social-comms';
import {
  ACTIVE_CONTENT_THEMES,
  CONTENT_FAMILY_LABELS,
  getContentTheme,
  type ContentFamilyId,
} from '@/lib/admin/social-pillars';
import { ADMIN_FIELD_CLASS } from '@/components/Admin/adminSurfaceClasses';

const NETWORKS: SocialNetwork[] = ['instagram', 'facebook', 'whatsapp', 'linkedin', 'tiktok'];

function postMatchesNetworkFilter(post: SocialPost, filter: SocialNetwork): boolean {
  if (filter === 'facebook') {
    return (
      post.network === 'facebook' ||
      (post.network === 'instagram' && post.alsoPublishFacebook && post.status !== 'skipped')
    );
  }
  return post.network === filter;
}

function calendarChipStyle(post: SocialPost): { bg: string; text: string; border: string; label: string } {
  if (post.network === 'instagram' && post.alsoPublishFacebook) {
    const ig = SOCIAL_NETWORK_COLORS.instagram;
    return { bg: ig.bg, text: ig.text, border: SOCIAL_NETWORK_COLORS.facebook.border, label: 'IG+FB' };
  }
  const c = SOCIAL_NETWORK_COLORS[post.network];
  return { bg: c.bg, text: c.text, border: c.border, label: c.short };
}

function postStatusAccent(status: SocialPost['status']) {
  if (status === 'scheduled') {
    return {
      cardClass: 'border-l-[5px] border-l-[#2563eb] shadow-[inset_0_0_0_1px_rgba(37,99,235,0.14)]',
      badgeClass: 'bg-[#dbeafe] text-[#1e40af] ring-1 ring-[#93c5fd]',
    };
  }
  if (status === 'published') {
    return {
      cardClass: 'border-l-[5px] border-l-[#059669] shadow-[inset_0_0_0_1px_rgba(5,150,105,0.14)]',
      badgeClass: 'bg-[#d1fae5] text-[#065f46] ring-1 ring-[#6ee7b7]',
    };
  }
  return { cardClass: '', badgeClass: 'bg-white text-luxury-soft' };
}

function calendarPostStatusMeta(post: SocialPost) {
  if (post.status === 'published') {
    return { accentColor: '#059669', label: 'Publié' as const };
  }
  if (post.status === 'scheduled') {
    return { accentColor: '#2563eb', label: 'Programmé' as const };
  }
  return { accentColor: null as string | null, label: null as 'Publié' | 'Programmé' | null };
}

function isPositiveActionMessage(message: string) {
  return /programmé|publié|Instagram|Facebook|file FitMangas|cron publiera/i.test(message);
}

function isErrorActionMessage(message: string) {
  return /impossible|échoué|erreur|bloqué|introuvable|revoir|manquante|périmée|connecte Meta/i.test(message);
}

type WorkflowTab = 'en_cours' | 'programmes' | 'archives';

function postMatchesWorkflowTab(post: SocialPost, tab: WorkflowTab): boolean {
  if (tab === 'en_cours') return post.status === 'idea' || post.status === 'ready';
  if (tab === 'programmes') return post.status === 'scheduled';
  return post.status === 'published' || post.status === 'skipped';
}

function buildCopyText(post: SocialPost) {
  return captionForPublish(post);
}

function imageOptionsForPost(post: SocialPost) {
  const options = [...SOCIAL_LIBRARY_IMAGES];
  if (post.imagePath && !options.includes(post.imagePath as (typeof SOCIAL_LIBRARY_IMAGES)[number])) {
    return [post.imagePath, ...options];
  }
  return options;
}

type Props = {
  board: SocialCommsBoard;
  meta: MetaSocialConnection;
  metaAppReady: boolean;
  alejandraDouble: AlejandraDoubleProfile;
  /** Flag serveur ALEJANDRA_DOUBLE_ENABLED — masque le panneau si false. */
  doubleUiEnabled?: boolean;
  pillarHistoryLabels?: string[];
  weekMixLabel?: string | null;
};

export function CommunityManagerBoard({
  board,
  meta,
  metaAppReady,
  alejandraDouble,
  doubleUiEnabled = false,
  pillarHistoryLabels = [],
  weekMixLabel = null,
}: Props) {
  const router = useRouter();
  const [networkFilter, setNetworkFilter] = useState<SocialNetwork>('instagram');
  const [workflowTab, setWorkflowTab] = useState<WorkflowTab>('en_cours');
  const [manualMenuOpen, setManualMenuOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('month');
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [draftCaptions, setDraftCaptions] = useState<Record<string, string>>({});
  const [draftFeedback, setDraftFeedback] = useState<Record<string, string>>({});
  const [previewPost, setPreviewPost] = useState<SocialPost | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showMetaPanel, setShowMetaPanel] = useState(false);
  const [showDoublePanel, setShowDoublePanel] = useState(false);
  const [showStrategyPanel, setShowStrategyPanel] = useState(false);
  const [generationFlow, setGenerationFlow] = useState<{
    runId: string | null;
    total: number;
    done: number;
    failed: number;
    pending: number;
    active: boolean;
  }>({ runId: null, total: 0, done: 0, failed: 0, pending: 0, active: false });
  const [doubleEnabled, setDoubleEnabled] = useState(alejandraDouble.enabled);
  const [doubleRefs, setDoubleRefs] = useState<string[]>(alejandraDouble.referencePaths);
  const [tokenForm, setTokenForm] = useState({
    pageId: meta.pageId || '',
    pageName: meta.pageName || '',
    igUserId: meta.igUserId || '',
    igUsername: meta.igUsername || '',
    accessToken: '',
  });

  const weekStart = useMemo(() => {
    const start = startOfWeekMonday(new Date());
    start.setDate(start.getDate() + weekOffset * 7);
    return start;
  }, [weekOffset]);

  const monthAnchor = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return date;
    });
  }, [weekStart]);

  const monthDays = useMemo(() => monthGridDays(monthAnchor), [monthAnchor]);

  const posts = useMemo(() => {
    const filtered = board.posts.filter(
      (post) => postMatchesNetworkFilter(post, networkFilter) && postMatchesWorkflowTab(post, workflowTab),
    );
    return [...filtered].sort((a, b) => {
      const aTime = a.plannedAt ? new Date(a.plannedAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.plannedAt ? new Date(b.plannedAt).getTime() : Number.MAX_SAFE_INTEGER;
      if (workflowTab === 'archives') return bTime - aTime;
      return aTime - bTime;
    });
  }, [board.posts, networkFilter, workflowTab]);

  const workflowCounts = useMemo(() => {
    const forNetwork = board.posts.filter((post) => postMatchesNetworkFilter(post, networkFilter));
    return {
      en_cours: forNetwork.filter((p) => postMatchesWorkflowTab(p, 'en_cours')).length,
      programmes: forNetwork.filter((p) => postMatchesWorkflowTab(p, 'programmes')).length,
      archives: forNetwork.filter((p) => postMatchesWorkflowTab(p, 'archives')).length,
    };
  }, [board.posts, networkFilter]);

  const counts = useMemo(() => {
    return NETWORKS.reduce(
      (acc, network) => {
        acc[network] = board.posts.filter((post) => postMatchesNetworkFilter(post, network) && post.status !== 'skipped')
          .length;
        return acc;
      },
      {} as Record<SocialNetwork, number>,
    );
  }, [board.posts]);

  const generationNetworks = useMemo(() => resolveGenerationNetworks(networkFilter), [networkFilter]);
  const generationSummary = useMemo(() => weekPlanSummary(generationNetworks), [generationNetworks]);

  const whatsappDue = useMemo(() => {
    const now = Date.now();
    return board.posts.filter(
      (post) =>
        post.network === 'whatsapp' &&
        post.status === 'scheduled' &&
        post.plannedAt &&
        new Date(post.plannedAt).getTime() <= now,
    );
  }, [board.posts]);

  useEffect(() => {
    setDoubleEnabled(alejandraDouble.enabled);
    setDoubleRefs(alejandraDouble.referencePaths);
  }, [alejandraDouble.enabled, alejandraDouble.referencePaths]);

  const previewSlides = useMemo(() => {
    if (!previewPost) return [] as string[];
    if (previewPost.format === 'carousel' && previewPost.carouselPaths?.length) return previewPost.carouselPaths;
    return previewPost.imagePath ? [previewPost.imagePath] : [];
  }, [previewPost]);

  useEffect(() => {
    const slide = previewSlides[Math.min(previewIndex, Math.max(previewSlides.length - 1, 0))];
    if (!previewPost || !slide) {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    void renderSocialPostDataUrl(previewPost, {
      slideIndex: previewIndex,
      imagePathOverride: slide,
    })
      .then((url) => {
        if (!cancelled) setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(previewPost.imagePath);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [previewPost, previewSlides, previewIndex]);

  function run(action: () => Promise<{ ok: boolean; error?: string; message?: string }>, successMessage: string) {
    setMessage('');
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          setMessage(result.error || 'Action impossible.');
          return;
        }
        setMessage(result.message || successMessage);
        router.refresh();
      } catch (err) {
        // Sans catch : un JSON invalide (ex. page 413 Vercel) plantait toute la page
        // sur « Un imprévu est survenu » (app/error.tsx).
        const msg = err instanceof Error ? err.message : 'Action impossible.';
        setMessage(msg);
      }
    });
  }

  async function runProgressiveGeneration(mode: 'fresh' | 'retry_failed') {
    if (pending || generationFlow.active) return;
    setMessage('');
    setGenerationFlow((s) => ({ ...s, active: true }));
    try {
      let runId = generationFlow.runId;
      if (mode === 'fresh') {
        const init = await initWeekPlanAction(
          generationNetworks,
          ['fr'],
        );
        if (!init.ok || !init.runId) {
          setMessage(init.error || 'Impossible d’initialiser la génération.');
          setGenerationFlow((s) => ({ ...s, active: false }));
          return;
        }
        runId = init.runId;
        setGenerationFlow({
          runId,
          total: init.total ?? 0,
          done: 0,
          failed: 0,
          pending: init.total ?? 0,
          active: true,
        });
      } else {
        if (!runId) {
          setMessage('Aucun run en cours à relancer.');
          setGenerationFlow((s) => ({ ...s, active: false }));
          return;
        }
        await requeueFailedWeekPlanAction(runId);
      }

      if (!runId) {
        setGenerationFlow((s) => ({ ...s, active: false }));
        return;
      }

      while (true) {
        const next = await generateNextPostAction(runId, 'pending');
        setGenerationFlow((s) => ({
          ...s,
          runId,
          total: next.total ?? s.total,
          done: next.done ?? s.done,
          failed: next.failed ?? s.failed,
          pending: next.pending ?? s.pending,
          active: !next.completed,
        }));
        router.refresh();
        if (next.completed) break;
      }

      const fin = await finalizeWeekPlanAction(runId);
      if (fin.ok) {
        setGenerationFlow((s) => ({
          ...s,
          runId,
          total: fin.total ?? s.total,
          done: fin.done ?? s.done,
          failed: fin.failed ?? s.failed,
          pending: fin.pending ?? s.pending,
          active: false,
        }));
        setMessage(fin.message || 'Génération terminée.');
      } else {
        setGenerationFlow((s) => ({ ...s, active: false }));
        setMessage(fin.error || 'Finalisation impossible.');
      }
    } catch (e) {
      setGenerationFlow((s) => ({ ...s, active: false }));
      setMessage(e instanceof Error ? e.message : 'Erreur inconnue.');
    }
  }

  async function copyPost(post: SocialPost) {
    try {
      await navigator.clipboard.writeText(buildCopyText(post));
      setCopiedId(post.id);
      setTimeout(() => setCopiedId((current) => (current === post.id ? null : current)), 1800);
    } catch {
      setMessage('Impossible de copier le texte.');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/65 bg-white/70 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">Community Manager</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-luxury-ink md:text-3xl">Programme & publications</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => markAllSocialPostsReadyAction(), 'Tous les posts idées sont passés en Prêt.')}
              className="btn-luxury-ghost min-h-[44px] px-4 text-[11px] disabled:opacity-60"
            >
              Tout marquer prêt
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(() => polishExistingSocialPostsAction(), 'Posts peaufinés.')
              }
              className="btn-luxury-ghost min-h-[44px] px-4 text-[11px] disabled:opacity-60"
              title="Corrige titres, légendes et plans face cam des posts déjà générés (sans nouvelle IA)"
            >
              Peaufiner les posts
            </button>
            <button
              type="button"
              disabled={pending || generationFlow.active || networkFilter === 'facebook'}
              onClick={() => void runProgressiveGeneration('fresh')}
              className="btn-luxury-primary inline-flex min-h-[44px] items-center gap-2 px-5 text-xs disabled:opacity-60"
              title={
                networkFilter === 'facebook'
                  ? 'Passe sur Instagram pour générer (FB = miroir auto).'
                  : undefined
              }
            >
              {pending || generationFlow.active ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {pending || generationFlow.active
                ? 'Génération…'
                : networkFilter === 'facebook'
                  ? 'Voir Instagram pour générer'
                  : networkFilter === 'instagram'
                    ? 'Générer Instagram (FR)'
                    : `Générer ${SOCIAL_NETWORK_LABELS[networkFilter]}`}
            </button>
            <button
              type="button"
              disabled={pending || generationFlow.active}
              onClick={() => run(() => generateConseilSeriesPostAction(), 'Conseil généré.')}
              className="btn-luxury-ghost min-h-[44px] px-4 text-[11px] disabled:opacity-60"
              title="Série Conseil n°1–50 (portée, compteur mémorisé)"
            >
              Générer un Conseil
            </button>
            {pending || generationFlow.active ? (
              <p className="w-full text-xs text-luxury-soft">
                Génération {SOCIAL_NETWORK_LABELS[networkFilter === 'facebook' ? 'instagram' : networkFilter]} · FR
                ({generationSummary}) — progression: {generationFlow.done}/{generationFlow.total || '…'} ·
                échecs {generationFlow.failed}.
              </p>
            ) : null}
            {!generationFlow.active && generationFlow.runId && generationFlow.failed > 0 ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => void runProgressiveGeneration('retry_failed')}
                className="btn-luxury-ghost min-h-[40px] px-4 text-[11px] disabled:opacity-60"
              >
                Reprendre les échecs ({generationFlow.failed})
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {NETWORKS.map((network) => (
            <FilterChip
              key={network}
              active={networkFilter === network}
              onClick={() => setNetworkFilter(network)}
              label={
                network === 'facebook'
                  ? `Facebook · via IG (${counts.facebook})`
                  : `${SOCIAL_NETWORK_LABELS[network]} (${counts[network]})`
              }
            />
          ))}
          <button
            type="button"
            title={
              pillarHistoryLabels.length
                ? `Stratégie CM — 8 derniers thèmes : ${pillarHistoryLabels.join(' → ')}`
                : 'Stratégie CM'
            }
            aria-label="Ouvrir la stratégie community manager"
            onClick={() => setShowStrategyPanel(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E8D9C8] bg-white text-[#7a2e1a] shadow-sm transition hover:border-[#C45D3E]/50 hover:bg-[#FBF7F2]"
          >
            <CircleHelp size={16} strokeWidth={2} />
          </button>
          <span className="text-[10px] text-luxury-muted">
            Meta{' '}
            {meta.accessToken
              ? meta.tokenExpiresAt && new Date(meta.tokenExpiresAt).getTime() < Date.now()
                ? `· expiré${meta.tokenExpiresAt ? ` (${new Date(meta.tokenExpiresAt).toLocaleDateString('fr-FR')})` : ''}`
                : meta.tokenExpiresAt
                  ? `· valide jusqu’au ${new Date(meta.tokenExpiresAt).toLocaleDateString('fr-FR')}`
                  : '· token présent (date inconnue — vérifier)'
              : '· non connecté'}
            <button type="button" className="ml-1 underline decoration-[#C45D3E]/40" onClick={() => setShowMetaPanel((v) => !v)}>
              {showMetaPanel ? 'masquer' : 'régler'}
            </button>
          </span>
          {doubleUiEnabled ? (
            <button
              type="button"
              onClick={() => setShowDoublePanel((v) => !v)}
              className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                alejandraDouble.enabled
                  ? 'bg-[#eef8ff] text-[#1a4a7a] ring-1 ring-[#1a4a7a]/20'
                  : 'border border-[#E8D9C8] bg-white text-luxury-soft'
              }`}
              title="Double Alejandra — PHOTA (flag ALEJANDRA_DOUBLE_ENABLED)"
            >
              Double{' '}
              {alejandraDouble.photaStatus === 'READY'
                ? '· PHOTA prêt'
                : alejandraDouble.photaStatus
                  ? `· ${alejandraDouble.photaStatus}`
                  : `· ${alejandraDouble.referencePaths.length} photos`}
            </button>
          ) : null}
        </div>

        {weekMixLabel ? (
          <p className="mt-2 text-[11px] font-semibold text-[#7a2e1a]">{weekMixLabel}</p>
        ) : (
          <p className="mt-2 text-[10px] text-luxury-muted">
            Mix cible : 3 portée · 3 confiance · 1 conversion (ou 3/2/2 en alternance)
          </p>
        )}

        {showDoublePanel && doubleUiEnabled ? (
          <div className="mt-3 rounded-2xl border border-[#c5daf0]/80 bg-[#f7fbff]/90 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1a4a7a]">
                  Double Alejandra · PHOTA (PhotoLabs)
                </p>
                <p className="mt-1 max-w-2xl text-[11px] leading-5 text-luxury-muted">
                  Entraînement réel sur Nano Banana 2 (sans Dupliq) : Full Train 10–50 photos (~8 min, ~$2.90) ou Quick
                  5–10 (~3 min). Une fois READY, chaque visuel IA utilise le profil calibré. Fallback Gemini + 4 refs si
                  PHOTA indisponible.
                </p>
                <p className="mt-1 text-[11px] text-[#1a4a7a]">
                  Statut :{' '}
                  <strong>
                    {alejandraDouble.photaStatus || 'pas encore entraîné'}
                    {alejandraDouble.photaProfileId ? ` · ${alejandraDouble.photaProfileId.slice(0, 10)}…` : ''}
                  </strong>
                  {alejandraDouble.photaMessage ? ` — ${alejandraDouble.photaMessage}` : ''}
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-luxury-ink">
                <input
                  type="checkbox"
                  checked={doubleEnabled}
                  onChange={(e) => setDoubleEnabled(e.target.checked)}
                />
                Actif sur les visuels IA
              </label>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {SOCIAL_LIBRARY_IMAGES.map((src) => {
                const selected = doubleRefs.includes(src);
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() =>
                      setDoubleRefs((prev) => {
                        if (prev.includes(src)) return prev.filter((p) => p !== src);
                        if (prev.length >= 50) return prev;
                        return [...prev, src];
                      })
                    }
                    className={`relative aspect-[4/5] overflow-hidden rounded-xl border-2 ${
                      selected ? 'border-[#1a4a7a] ring-2 ring-[#1a4a7a]/25' : 'border-transparent opacity-70'
                    }`}
                    title={src.split('/').pop()}
                  >
                    <Image src={src} alt="" fill className="object-cover" sizes="120px" />
                    {selected ? (
                      <span className="absolute left-1 top-1 rounded bg-[#1a4a7a] px-1.5 py-0.5 text-[9px] font-bold text-white">
                        ✓
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending || doubleRefs.length < 2}
                className="btn-luxury-ghost px-3 py-2 text-[10px] disabled:opacity-50"
                onClick={() =>
                  run(
                    () => saveAlejandraDoubleAction({ enabled: doubleEnabled, referencePaths: doubleRefs }),
                    'Pack photos enregistré.',
                  )
                }
              >
                Sauver le pack ({doubleRefs.length})
              </button>
              <button
                type="button"
                disabled={pending || doubleRefs.length < 10}
                className="btn-luxury-primary px-3 py-2 text-[10px] disabled:opacity-50"
                title="Full Train PHOTA — meilleure fidélité (10–50 photos)"
                onClick={() =>
                  run(async () => {
                    await saveAlejandraDoubleAction({ enabled: true, referencePaths: doubleRefs });
                    return trainAlejandraPhotaAction('standard');
                  }, 'Entraînement Full Train lancé…')
                }
              >
                {pending ? <Loader2 size={12} className="mr-1 inline animate-spin" /> : null}
                Entraîner Full ({Math.min(doubleRefs.length, 50)})
              </button>
              <button
                type="button"
                disabled={pending || doubleRefs.length < 5}
                className="btn-luxury-ghost px-3 py-2 text-[10px] disabled:opacity-50"
                title="Quick Train — plus rapide, un peu moins fidèle"
                onClick={() =>
                  run(async () => {
                    await saveAlejandraDoubleAction({ enabled: true, referencePaths: doubleRefs });
                    return trainAlejandraPhotaAction('fast');
                  }, 'Entraînement Quick lancé…')
                }
              >
                Quick Train
              </button>
              <button
                type="button"
                disabled={pending || !alejandraDouble.photaProfileId}
                className="btn-luxury-ghost px-3 py-2 text-[10px] disabled:opacity-50"
                onClick={() => run(() => refreshAlejandraPhotaStatusAction(), 'Statut PHOTA rafraîchi.')}
              >
                Rafraîchir statut
              </button>
              <button
                type="button"
                disabled={pending}
                className="btn-luxury-ghost px-3 py-2 text-[10px]"
                onClick={() => {
                  setDoubleRefs([...SOCIAL_LIBRARY_IMAGES]);
                  run(() => resetAlejandraDoubleAction(), 'Pack biblio restauré.');
                }}
              >
                Toute la biblio
              </button>
            </div>
          </div>
        ) : null}

        {showMetaPanel ? (
          <div className="mt-3 max-w-xl rounded-2xl border border-[#E8D9C8]/80 bg-white/80 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a2e1a]">Meta IG/FB</p>
            <p className="mt-1 text-[11px] text-luxury-muted">
              {meta.connected
                ? `${meta.pageName || meta.pageId}${meta.igUsername ? ` · @${meta.igUsername}` : ''}`
                : 'Token Page ou OAuth'}
            </p>
            <div className="mt-2 space-y-2">
              <input
                className={ADMIN_FIELD_CLASS}
                placeholder="Page ID Facebook (chiffres de la Page — PAS Instagram)"
                value={tokenForm.pageId}
                onChange={(e) => setTokenForm((s) => ({ ...s, pageId: e.target.value }))}
              />
              <input
                className={ADMIN_FIELD_CLASS}
                placeholder="IG Business User ID (différent du Page ID)"
                value={tokenForm.igUserId}
                onChange={(e) => setTokenForm((s) => ({ ...s, igUserId: e.target.value }))}
              />
              <p className="w-full text-[10px] text-luxury-muted">
                Page ID et IG User ID sont deux numéros distincts. Via Graph API Explorer : GET /me/accounts → id (Page) +
                instagram_business_account.id.
              </p>
              <input className={ADMIN_FIELD_CLASS} placeholder="Page Access Token" value={tokenForm.accessToken} onChange={(e) => setTokenForm((s) => ({ ...s, accessToken: e.target.value }))} />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  className="btn-luxury-primary px-3 py-2 text-[10px]"
                  onClick={() =>
                    run(
                      () =>
                        saveMetaConnectionManualAction({
                          pageId: tokenForm.pageId,
                          pageName: tokenForm.pageName,
                          igUserId: tokenForm.igUserId,
                          igUsername: tokenForm.igUsername,
                          accessToken: tokenForm.accessToken || meta.accessToken || '',
                        }),
                      'Meta enregistré.',
                    )
                  }
                >
                  Enregistrer
                </button>
                {metaAppReady ? (
                  <button
                    type="button"
                    className="btn-luxury-ghost px-3 py-2 text-[10px]"
                    onClick={() =>
                      void getMetaConnectUrlAction().then((res) => {
                        if (res.ok && res.url) window.location.href = res.url;
                        else setMessage(res.error || 'OAuth indisponible.');
                      })
                    }
                  >
                    OAuth Meta
                  </button>
                ) : null}
                {meta.connected ? (
                  <button
                    type="button"
                    className="btn-luxury-ghost px-3 py-2 text-[10px] text-red-800"
                    onClick={() => run(() => disconnectMetaAction(), 'Meta déconnecté.')}
                  >
                    Déconnecter
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {message ? (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${
              isErrorActionMessage(message)
                ? 'border-[#fecaca] bg-[#fef2f2] text-[#991b1b]'
                : isPositiveActionMessage(message)
                  ? 'border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46]'
                  : 'border-[#E8D9C8] bg-white text-luxury-muted'
            }`}
            role="status"
          >
            {message}
          </div>
        ) : null}
      </section>

      <section className="rounded-[2rem] border border-white/65 bg-white/70 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-[#C45D3E]" />
            <div>
              <h2 className="text-lg font-semibold text-luxury-ink">
                {calendarView === 'month' ? 'Calendrier du mois' : 'Calendrier de la semaine'}
              </h2>
              <p className="text-[11px] text-luxury-soft">Tous les réseaux (indépendant de l’onglet ci-dessus)</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-full px-3 py-2 text-[11px] font-semibold ${calendarView === 'month' ? 'bg-[#c45d3e] text-white' : 'btn-luxury-ghost'}`}
              onClick={() => setCalendarView('month')}
            >
              Mois
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-2 text-[11px] font-semibold ${calendarView === 'week' ? 'bg-[#c45d3e] text-white' : 'btn-luxury-ghost'}`}
              onClick={() => setCalendarView('week')}
            >
              Semaine
            </button>
            {calendarView === 'month' ? (
              <>
                <button type="button" className="btn-luxury-ghost px-3 py-2 text-[11px]" onClick={() => setMonthOffset((v) => v - 1)}>
                  ← Mois
                </button>
                <button type="button" className="btn-luxury-ghost px-3 py-2 text-[11px]" onClick={() => setMonthOffset(0)}>
                  Ce mois
                </button>
                <button type="button" className="btn-luxury-ghost px-3 py-2 text-[11px]" onClick={() => setMonthOffset((v) => v + 1)}>
                  Mois →
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn-luxury-ghost px-3 py-2 text-[11px]" onClick={() => setWeekOffset((v) => v - 1)}>
                  ← Semaine
                </button>
                <button type="button" className="btn-luxury-ghost px-3 py-2 text-[11px]" onClick={() => setWeekOffset(0)}>
                  Aujourd’hui
                </button>
                <button type="button" className="btn-luxury-ghost px-3 py-2 text-[11px]" onClick={() => setWeekOffset((v) => v + 1)}>
                  Semaine →
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-luxury-soft">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#2563eb]" aria-hidden />
            Programmé
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#059669]" aria-hidden />
            Publié
          </span>
        </div>

        {calendarView === 'week' ? (
          <div className="mt-4 grid gap-2 md:grid-cols-7">
            {weekDays.map((day) => {
              const key = localDayKey(day);
              const dayPosts = board.posts.filter(
                (post) => post.status !== 'skipped' && post.plannedAt && localDayKey(new Date(post.plannedAt)) === key,
              );
              return (
                <DayCell key={key} day={day} dayPosts={dayPosts} />
              );
            })}
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm font-medium text-luxury-ink">
              {monthAnchor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
            <div className="mt-2 grid grid-cols-7 gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">
              {['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'].map((d) => (
                <div key={d} className="px-1 py-1 text-center">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const key = localDayKey(day);
                const inMonth = day.getMonth() === monthAnchor.getMonth();
                const dayPosts = board.posts.filter(
                  (post) => post.status !== 'skipped' && post.plannedAt && localDayKey(new Date(post.plannedAt)) === key,
                );
                return (
                  <DayCell key={key} day={day} dayPosts={dayPosts} muted={!inMonth} compact />
                );
              })}
            </div>
          </>
        )}
      </section>

      {whatsappDue.length > 0 ? (
        <section className="rounded-[2rem] border border-[#C45D3E]/35 bg-[#fff4ee] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
          <h2 className="text-lg font-semibold text-luxury-ink">WhatsApp — à envoyer maintenant</h2>
          <p className="mt-1 text-sm text-luxury-muted">
            Copie le texte, télécharge le visuel (logo inclus), envoie dans le groupe, puis marque « Publié (manuel) ».
          </p>
          <ul className="mt-4 space-y-3">
            {whatsappDue.map((post) => (
              <li
                key={post.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-luxury-ink">{post.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-luxury-muted">{post.caption}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void copyPost(post)}
                    className="btn-luxury-primary inline-flex min-h-[40px] items-center gap-2 px-4 text-[11px]"
                  >
                    {copiedId === post.id ? <Check size={14} /> : <Copy size={14} />}
                    Copier
                  </button>
                  {post.imagePath ? (
                    <button
                      type="button"
                      className="btn-luxury-ghost inline-flex min-h-[40px] items-center gap-2 px-4 text-[11px]"
                      onClick={() =>
                        void downloadSocialPostImage(post).catch(() => setMessage('Export image impossible.'))
                      }
                    >
                      <Download size={14} />
                      Visuel
                    </button>
                  ) : null}
                  <a href={`#post-${post.id}`} className="btn-luxury-ghost inline-flex min-h-[40px] items-center px-4 text-[11px]">
                    Voir
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-[1.5rem] border border-white/65 bg-white/70 p-2 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
          {(
            [
              {
                id: 'en_cours' as const,
                label: 'En cours',
                hint: 'Posts générés à valider (idée / prêt)',
              },
              {
                id: 'programmes' as const,
                label: 'Programmés',
                hint: 'Validés, en file d’attente de publication',
              },
              {
                id: 'archives' as const,
                label: 'Archivés',
                hint: 'Publiés (immédiat ou après programmation)',
              },
            ] as const
          ).map((tab) => {
            const active = workflowTab === tab.id;
            const count = workflowCounts[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                title={tab.hint}
                onClick={() => setWorkflowTab(tab.id)}
                className={`inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-full px-4 text-[11px] font-semibold uppercase tracking-[0.12em] transition sm:flex-none ${
                  active
                    ? tab.id === 'programmes'
                      ? 'bg-[#2563eb] text-white'
                      : tab.id === 'archives'
                        ? 'bg-[#059669] text-white'
                        : 'bg-[#C45D3E] text-white'
                    : 'bg-white/80 text-luxury-soft hover:bg-white'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    active ? 'bg-white/20 text-white' : 'bg-[#F3EEE7] text-luxury-ink'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <div className="relative ml-auto">
            <button
              type="button"
              title="Créer un post manuel (sans IA)"
              aria-expanded={manualMenuOpen}
              onClick={() => setManualMenuOpen((v) => !v)}
              className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#E8D9C8] bg-white text-luxury-ink shadow-sm transition hover:border-[#C45D3E] hover:text-[#C45D3E]"
            >
              <Plus size={18} strokeWidth={2.25} />
            </button>
            {manualMenuOpen ? (
              <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-[#E8D9C8]/80 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
                <p className="border-b border-[#F0E6DA] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">
                  Nouveau post manuel
                </p>
                {(
                  [
                    { format: 'reel' as const, label: 'Vidéo / Reel à créer' },
                    { format: 'carousel' as const, label: 'Carousel' },
                    { format: 'feed' as const, label: 'Feed (photo)' },
                    { format: 'story' as const, label: 'Story' },
                    { format: 'text' as const, label: 'Texte seul' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.format}
                    type="button"
                    disabled={pending}
                    className="block w-full px-3 py-2.5 text-left text-[12px] font-medium text-luxury-ink hover:bg-[#FBF7F2] disabled:opacity-50"
                    onClick={() => {
                      setManualMenuOpen(false);
                      run(async () => {
                        const result = await createManualSocialPostAction({ format: opt.format });
                        if (result.ok) {
                          setWorkflowTab('en_cours');
                          if (result.postId) {
                            window.setTimeout(() => {
                              document
                                .getElementById(`post-${result.postId}`)
                                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 250);
                          }
                        }
                        return result;
                      }, `Post ${opt.label} créé.`);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-[#C45D3E]/25 bg-white/55 px-5 py-10 text-center text-sm text-luxury-muted">
            {workflowTab === 'en_cours'
              ? 'Aucun post en cours. Clique sur « Générer Instagram » pour en créer.'
              : workflowTab === 'programmes'
                ? 'Aucun post programmé. Valide un post puis clique sur « Programmer ».'
                : 'Aucun post archivé pour cet onglet réseau.'}
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              hasLinkedInAdaptation={board.posts.some(
                (item) => item.network === 'linkedin' && item.adaptedFromId === post.id,
              )}
              caption={draftCaptions[post.id] ?? post.caption}
              feedback={draftFeedback[post.id] ?? post.imageFeedback}
              pending={pending}
              copiedId={copiedId}
              useDouble={doubleUiEnabled && alejandraDouble.enabled}
              onCaptionChange={(value) => setDraftCaptions((c) => ({ ...c, [post.id]: value }))}
              onFeedbackChange={(value) => setDraftFeedback((c) => ({ ...c, [post.id]: value }))}
              onPreview={(slideIndex = 0) => {
                setPreviewIndex(slideIndex);
                setPreviewPost(post);
              }}
              onCopy={() => void copyPost(post)}
              run={run}
              setMessage={setMessage}
              onWorkflowTabChange={setWorkflowTab}
            />
          ))
        )}
      </section>

      {previewPost ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewPost(null)}
        >
          <div
            className="relative w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 z-20 rounded-full bg-black/50 p-2 text-white"
              onClick={() => setPreviewPost(null)}
            >
              <X size={18} />
            </button>

            <div className="border-b border-black/5 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 overflow-hidden rounded-full bg-[#C45D3E]/20 ring-1 ring-[#E8D9C8]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/apple-icon.png" alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-luxury-ink">fit.mangas</p>
                  <p className="text-[10px] text-luxury-muted">
                    {previewPost.format === 'reel' ? 'Reel' : previewPost.format === 'carousel' ? 'Carousel' : 'Publication'}
                  </p>
                </div>
              </div>
            </div>

            {/* Reel = 9:16 plein cadre. Feed/carousel = 4:5. Ne jamais forcer 4:5 sur un Reel
                (sinon bandes noires gauche/droite = artefact UI, pas le fichier). */}
            <div
              className={`relative w-full max-h-[70vh] bg-[#111] ${
                previewPost.format === 'reel' ? 'aspect-[9/16]' : 'aspect-[4/5]'
              }`}
            >
              {previewPost.format === 'reel' &&
              (previewPost.editedVideoPath || previewPost.rawVideoPath) ? (
                <video
                  key={previewPost.editedVideoPath || previewPost.rawVideoPath || previewPost.id}
                  src={previewPost.editedVideoPath || previewPost.rawVideoPath || undefined}
                  className="h-full w-full object-cover"
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : previewLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="animate-spin text-white" size={28} />
                </div>
              ) : previewUrl || previewPost.imagePath ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl || previewPost.imagePath || ''}
                    alt="Aperçu Instagram"
                    className="h-full w-full object-contain"
                  />
                  {/* Pas de texte CSS en haut : l’image composée a déjà logo (haut) + grand texte (bas).
                      Exception Reel sans overlay brûlé : hook seul en haut (pas de doublon bas). */}
                  {previewPost.format === 'reel' &&
                  !previewPost.useOverlay &&
                  (previewPost.overlayText || previewPost.hookTitle) ? (
                    <div className="pointer-events-none absolute inset-x-0 top-[12%] px-6">
                      <p className="text-center text-[15px] font-bold uppercase leading-snug tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                        {previewPost.overlayText || previewPost.hookTitle}
                      </p>
                    </div>
                  ) : null}
                  {previewSlides.length > 1 ? (
                    <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
                      {previewSlides.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          aria-label={`Slide ${i + 1}`}
                          onClick={() => setPreviewIndex(i)}
                          className={`h-1.5 rounded-full transition ${
                            i === previewIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white/70">Aperçu indisponible</div>
              )}
            </div>

            {previewSlides.length > 1 ? (
              <div className="flex items-center justify-between gap-3 border-b border-black/5 px-3 py-2">
                <button
                  type="button"
                  className="rounded-full border border-[#E8D9C8] bg-white px-3 py-1 text-xs font-semibold disabled:opacity-40"
                  disabled={previewIndex <= 0}
                  onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                >
                  ←
                </button>
                <span className="text-[11px] text-luxury-muted">
                  Slide {Math.min(previewIndex + 1, previewSlides.length)} / {previewSlides.length}
                </span>
                <button
                  type="button"
                  className="rounded-full border border-[#E8D9C8] bg-white px-3 py-1 text-xs font-semibold disabled:opacity-40"
                  disabled={previewIndex >= previewSlides.length - 1}
                  onClick={() => setPreviewIndex((i) => Math.min(previewSlides.length - 1, i + 1))}
                >
                  →
                </button>
              </div>
            ) : null}

            <div className="px-3 py-2.5">
              <div className="mb-2 flex items-center gap-4 text-luxury-ink">
                <span aria-hidden>♡</span>
                <span aria-hidden>💬</span>
                <span aria-hidden>➤</span>
                <span className="ml-auto" aria-hidden>
                  ⤓
                </span>
              </div>
              <p className="text-[13px] leading-snug text-luxury-ink">
                <span className="font-semibold">fit.mangas</span>{' '}
                {(() => {
                  const full = `${previewPost.title}${previewPost.caption ? ` — ${previewPost.caption}` : ''}`.trim();
                  const cut = full.slice(0, 110);
                  return full.length > 110 ? (
                    <>
                      {cut}
                      <span className="text-luxury-muted">… plus</span>
                    </>
                  ) : (
                    full
                  );
                })()}
              </p>
              <p className="mt-2 text-center text-[10px] text-luxury-muted">Aperçu rendu Instagram (simulation)</p>
            </div>
          </div>
        </div>
      ) : null}

      {showStrategyPanel ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowStrategyPanel(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#E8D9C8] bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7a2e1a]">Stratégie CM</p>
                <h3 className="mt-1 text-lg font-semibold text-luxury-ink">Mix & horaires Paris</h3>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E8D9C8] bg-[#FBF7F2]"
                onClick={() => setShowStrategyPanel(false)}
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {NETWORKS.map((network) => {
                const g = SOCIAL_CM_GUIDELINES[network];
                const colors = SOCIAL_NETWORK_COLORS[network];
                return (
                  <div key={network} className="rounded-2xl border px-3 py-2.5" style={{ borderColor: `${colors.border}33`, backgroundColor: colors.bg }}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: colors.text }}>
                      {g.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-luxury-muted">{formatBestHours(network)}</p>
                    <p className="mt-1 text-[12px] leading-5 text-luxury-ink/80">{g.weeklyTarget}</p>
                  </div>
                );
              })}
            </div>
            <ul className="mt-4 space-y-1.5 text-[12px] leading-snug text-luxury-muted">
              {CM_STRATEGY_NOTES.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DayCell({
  day,
  dayPosts,
  muted = false,
  compact = false,
}: {
  day: Date;
  dayPosts: SocialPost[];
  muted?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`${compact ? 'min-h-[100px]' : 'min-h-[150px]'} rounded-2xl border border-white/70 p-2 ${muted ? 'bg-white/30 opacity-60' : 'bg-white/60'}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
        {compact
          ? day.getDate()
          : day.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
      </p>
      <div className="mt-1 space-y-1">
        {dayPosts.map((post) => {
          const chip = calendarChipStyle(post);
          const statusMeta = calendarPostStatusMeta(post);
          const localeTag = (post.locale ?? 'fr').toUpperCase();
          const tip = [
            `${chip.label} · ${localeTag} · ${post.format}`,
            statusMeta.label,
            post.hookTitle || post.title,
            post.title !== post.hookTitle ? post.title : null,
            post.plannedAt ? formatParisDateTime(post.plannedAt) : null,
          ]
            .filter(Boolean)
            .join('\n');
          return (
            <a
              key={post.id}
              href={`#post-${post.id}`}
              title={tip}
              className="block rounded-lg px-1.5 py-1 transition hover:opacity-90"
              style={{
                backgroundColor: chip.bg,
                color: chip.text,
                boxShadow: statusMeta.accentColor
                  ? `inset 4px 0 0 ${statusMeta.accentColor}`
                  : `inset 3px 0 0 ${chip.border}`,
              }}
            >
              <span className="flex items-center justify-between gap-1 text-[8px] font-bold uppercase tracking-[0.08em] opacity-90">
                <span>
                  {chip.label} · {localeTag}
                </span>
                {statusMeta.label ? (
                  <span
                    className="rounded px-1 py-px text-[7px] font-bold"
                    style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}
                  >
                    {statusMeta.label}
                  </span>
                ) : null}
              </span>
              <span className={`block font-semibold leading-tight ${compact ? 'line-clamp-2 text-[9px]' : 'line-clamp-2 text-[10px]'}`}>
                {post.hookTitle || post.title}
              </span>
              {post.status === 'scheduled' && post.plannedAt ? (
                <span className="mt-0.5 block text-[7px] font-semibold opacity-85">
                  {formatParisDateTime(post.plannedAt)}
                </span>
              ) : null}
            </a>
          );
        })}
        {dayPosts.length === 0 && !compact ? <p className="text-[10px] text-luxury-muted">—</p> : null}
      </div>
    </div>
  );
}

function PostCard({
  post,
  hasLinkedInAdaptation,
  caption,
  feedback,
  pending,
  copiedId,
  useDouble,
  onCaptionChange,
  onFeedbackChange,
  onPreview,
  onCopy,
  run,
  setMessage,
  onWorkflowTabChange,
}: {
  post: SocialPost;
  hasLinkedInAdaptation: boolean;
  caption: string;
  feedback: string;
  pending: boolean;
  copiedId: string | null;
  useDouble: boolean;
  onCaptionChange: (value: string) => void;
  onFeedbackChange: (value: string) => void;
  onPreview: (slideIndex?: number) => void;
  onCopy: () => void;
  run: (action: () => Promise<{ ok: boolean; error?: string; message?: string }>, successMessage: string) => void;
  setMessage: (msg: string) => void;
  onWorkflowTabChange: (tab: WorkflowTab) => void;
}) {
  const captionAnalysis = analyzeCaptionForPost(caption, post.network, post.format, post.hashtags.length);
  const canPublishMeta = post.network === 'instagram' || post.network === 'facebook';
  const isTikTok = post.network === 'tiktok';
  const isManualNetwork = post.network === 'whatsapp' || post.network === 'linkedin';
  const parisSchedule = parseParisSchedule(post.plannedAt);
  const parisHours = allowedParisHours(post.network);
  const isReel = post.format === 'reel';
  const isCarousel = post.format === 'carousel';
  const showAiImageTools = !isReel;
  const postLocale = post.locale ?? 'fr';
  const [localEditedVideo, setLocalEditedVideo] = useState<string | null>(null);
  const [reelUploadStatus, setReelUploadStatus] = useState<string | null>(null);
  const [reelUploadError, setReelUploadError] = useState<string | null>(null);
  const previewVideo = localEditedVideo || post.editedVideoPath || post.rawVideoPath;
  const networkColor = SOCIAL_NETWORK_COLORS[post.network];
  const [claudePromptCopied, setClaudePromptCopied] = useState(false);
  const [claudePromptError, setClaudePromptError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ kind: 'scheduled' | 'published'; message: string } | null>(
    null,
  );
  const [reelUploadPending, startReelUpload] = useTransition();
  const router = useRouter();
  const statusAccent = postStatusAccent(post.status);
  const showStatusBanner = post.status === 'scheduled' || post.status === 'published' || Boolean(actionFeedback);
  const bannerKind =
    actionFeedback?.kind === 'published' || (!actionFeedback && post.status === 'published') ? 'published' : 'scheduled';
  const justScheduled = actionFeedback?.kind === 'scheduled';
  const justPublished = actionFeedback?.kind === 'published';

  useEffect(() => {
    if (!actionFeedback) return;
    const timer = window.setTimeout(() => setActionFeedback(null), 12000);
    return () => window.clearTimeout(timer);
  }, [actionFeedback]);
  const carouselSlides =
    isCarousel && post.carouselPaths?.length
      ? post.carouselPaths
      : post.imagePath
        ? [post.imagePath]
        : [];
  const [carouselIndex, setCarouselIndex] = useState(0);
  const activeCarouselSrc = carouselSlides[Math.min(carouselIndex, Math.max(carouselSlides.length - 1, 0))] || null;
  const videoStatusLabel: Record<string, string> = {
    brief: 'Vidéo à créer',
    raw_uploaded: 'Brute uploadée',
    editing: 'Montage…',
    edited: 'Montage prêt',
    ready: 'Prêt à publier',
  };

  return (
    <article
      id={`post-${post.id}`}
      className={`overflow-hidden rounded-[1.5rem] border border-[#E8D9C8]/50 bg-white/80 shadow-sm ${statusAccent.cardClass}`}
    >
      <div className="grid gap-0 lg:grid-cols-[200px_minmax(0,1fr)]">
        <div className="group relative min-h-[220px] bg-brand-beige">
          {isReel && previewVideo ? (
            <>
              <video
                src={previewVideo}
                className="absolute inset-0 h-full w-full object-cover"
                muted
                playsInline
                controls
                preload="metadata"
              />
              <button
                type="button"
                onClick={() => onPreview(0)}
                className="absolute inset-0 z-[1] flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100"
                aria-label="Prévisualiser le Reel"
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-luxury-ink shadow-lg">
                  <Eye size={16} />
                  Aperçu
                </span>
              </button>
            </>
          ) : isCarousel && carouselSlides.length ? (
            <div className="absolute inset-0 flex flex-col">
              <div className="relative min-h-0 flex-1">
                {activeCarouselSrc ? (
                  <Image
                    src={activeCarouselSrc}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="220px"
                    unoptimized={activeCarouselSrc.startsWith('http')}
                  />
                ) : null}
                <div className="absolute inset-x-0 bottom-0 z-[2] flex items-center justify-between gap-1 bg-black/45 px-2 py-1.5">
                  <button
                    type="button"
                    className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-luxury-ink disabled:opacity-40"
                    disabled={carouselIndex <= 0}
                    onClick={() => setCarouselIndex((i) => Math.max(0, i - 1))}
                  >
                    ←
                  </button>
                  <span className="text-[10px] font-semibold text-white">
                    Slide {carouselIndex + 1}/{carouselSlides.length}
                  </span>
                  <button
                    type="button"
                    className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-luxury-ink disabled:opacity-40"
                    disabled={carouselIndex >= carouselSlides.length - 1}
                    onClick={() => setCarouselIndex((i) => Math.min(carouselSlides.length - 1, i + 1))}
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onPreview(carouselIndex)}
                  className="absolute inset-0 z-[1] mb-8 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100"
                  aria-label="Prévisualiser le carousel"
                >
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-luxury-ink shadow-lg">
                    <Eye size={16} />
                    Aperçu
                  </span>
                </button>
              </div>
              <div className="relative z-[2] flex gap-1 overflow-x-auto bg-white/90 p-1.5">
                {carouselSlides.map((src, idx) => (
                  <button
                    key={`${src}-${idx}`}
                    type="button"
                    onClick={() => setCarouselIndex(idx)}
                    className={`relative h-12 w-10 shrink-0 overflow-hidden rounded-md border ${
                      idx === carouselIndex ? 'border-[#C45D3E] ring-1 ring-[#C45D3E]/40' : 'border-transparent opacity-80'
                    }`}
                  >
                    <Image src={src} alt="" fill className="object-cover" sizes="40px" unoptimized={src.startsWith('http')} />
                  </button>
                ))}
              </div>
            </div>
          ) : post.imagePath ? (
            <>
              <Image src={post.imagePath} alt="" fill className="object-cover" sizes="200px" unoptimized={post.imagePath.startsWith('http')} />
              {post.useOverlay && post.overlayText ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-center font-serif text-sm uppercase leading-snug tracking-wide text-white">
                    {post.overlayText}
                  </p>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => onPreview(0)}
                className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100"
                aria-label="Prévisualiser le visuel"
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-luxury-ink shadow-lg">
                  <Eye size={16} />
                  Aperçu
                </span>
              </button>
            </>
          ) : (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2.5 bg-gradient-to-b from-[#F7F0E8] to-[#E8DFD2] px-5 text-center">
              {isReel ? (
                <>
                  <div className="flex h-16 w-10 items-center justify-center rounded-lg border-2 border-dashed border-[#C45D3E]/45 text-[#C45D3E]">
                    <Film size={18} strokeWidth={1.75} />
                  </div>
                  <p className="text-[12px] font-semibold text-luxury-ink">Pas encore de MP4</p>
                  <p className="max-w-[11rem] text-[10px] leading-snug text-luxury-muted">
                    Filmez en face cam, montez avec Claude Code, puis importez le fichier ici.
                  </p>
                </>
              ) : isCarousel ? (
                <>
                  <p className="text-[12px] font-semibold text-luxury-ink">Carousel sans slides</p>
                  <p className="text-[10px] text-luxury-muted">Regénère ou choisis des images bibliothèque.</p>
                </>
              ) : (
                <>
                  <p className="text-[12px] font-semibold text-luxury-ink">Visuel manquant</p>
                  <p className="text-[10px] text-luxury-muted">Choisis une photo ou regénère.</p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-5">
          {showStatusBanner ? (
            <div
              className={`mb-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 ${
                bannerKind === 'published'
                  ? post.alsoPublishFacebook && !post.facebookExternalId
                    ? 'border-[#fcd34d] bg-[#fffbeb] text-[#92400e]'
                    : 'border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46]'
                  : 'border-[#bfdbfe] bg-[#eff6ff] text-[#1e40af]'
              }`}
              role="status"
            >
              {bannerKind === 'published' ? (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden />
              ) : (
                <CalendarClock size={18} className="mt-0.5 shrink-0" aria-hidden />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {bannerKind === 'published'
                    ? post.network === 'instagram' && post.alsoPublishFacebook
                      ? post.facebookExternalId
                        ? 'Publié sur Instagram + Facebook'
                        : 'Publié sur Instagram — miroir Facebook manquant'
                      : 'Publié sur Meta'
                    : `Programmé — ${formatParisDateTime(post.plannedAt)}`}
                </p>
                <p className="mt-0.5 text-[12px] leading-snug opacity-90">
                  {actionFeedback?.message ||
                    (bannerKind === 'published'
                      ? post.alsoPublishFacebook && !post.facebookExternalId
                        ? 'Instagram est en ligne, mais Facebook n’a pas d’ID de publication. Clique « Publier miroir FB » ci-dessous.'
                        : 'Le post est en ligne. Le statut reste visible ici.'
                      : post.alsoPublishFacebook
                        ? 'Instagram en file. Miroir Facebook au même instant (cron FitMangas).'
                        : 'En file FitMangas. Publication automatique à l’heure prévue.')}
                </p>
                {post.facebookExternalId ? (
                  <p className="mt-1.5 text-[12px]">
                    <a
                      href={facebookPermalinkUrl(post.facebookExternalId, post.format)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold underline underline-offset-2"
                    >
                      Ouvrir sur Facebook →
                    </a>
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ backgroundColor: networkColor.bg, color: networkColor.text }}
            >
              {SOCIAL_NETWORK_LABELS[post.network]}
            </span>
            {post.network === 'instagram' && post.alsoPublishFacebook ? (
              <span
                className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{
                  backgroundColor: SOCIAL_NETWORK_COLORS.facebook.bg,
                  color: SOCIAL_NETWORK_COLORS.facebook.text,
                }}
              >
                + Facebook
              </span>
            ) : null}
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
              {post.format}
            </span>
            <span className="rounded-full bg-[#FBF7F2] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a2e1a]">
              {postLocale === 'es' ? 'ES' : 'FR'}
            </span>
            {post.contentFamily ? (
              <span className="rounded-full bg-[#eef8ff] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1a4a7a]">
                {CONTENT_FAMILY_LABELS[post.contentFamily]}
                {post.pillarId ? ` · ${getContentTheme(post.pillarId)?.label ?? post.pillarId}` : ''}
              </span>
            ) : post.pillarId ? (
              <span className="rounded-full bg-[#eef8ff] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1a4a7a]">
                {getContentTheme(post.pillarId)?.label ?? post.pillarId}
              </span>
            ) : null}
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${statusAccent.badgeClass}`}
            >
              {statusLabelForPost(post.status, post.format)}
            </span>
            {post.adaptedFromId ? (
              <span className="rounded-full bg-[#e8f4fc] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0a66c2]">
                Adapté
              </span>
            ) : null}
            {isReel && post.videoStatus ? (
              <span className="rounded-full bg-[#fff0e8] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a2e1a]">
                {videoStatusLabel[post.videoStatus] || post.videoStatus}
              </span>
            ) : null}
            {!isReel && post.imageSource && post.imageSource !== 'none' ? (
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                  post.imageSource === 'ai'
                    ? 'bg-[#eef8ff] text-[#1a4a7a]'
                    : post.imageSource === 'unsplash'
                      ? 'bg-[#f0faf0] text-[#1a5a2a]'
                      : 'bg-[#f7f3ee] text-luxury-soft'
                }`}
              >
                {socialImageProviderLabel(post.imageSource)}
              </span>
            ) : null}
            {post.titleNeedsReview ? (
              <span className="rounded-full bg-[#fff4e5] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a3412]">
                Titre à revoir
              </span>
            ) : null}
            {post.overlaysNeedReview ? (
              <span className="rounded-full bg-[#fff4e5] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a3412]">
                Overlays à revoir
              </span>
            ) : null}
            {post.carouselMissingSlides ? (
              <span className="rounded-full bg-[#fef2f2] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#991b1b]">
                Slide manquante
              </span>
            ) : null}
            {!isReel && post.format !== 'text' && (!post.imagePath || post.imageSource === 'none') ? (
              <span className="rounded-full bg-[#fef2f2] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#991b1b]">
                Image manquante
              </span>
            ) : null}
            {post.whyItWorksNeedsReview ? (
              <span className="rounded-full bg-[#fff4e5] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a3412]">
                whyItWorks à revoir
              </span>
            ) : null}
            {post.esStale ? (
              <span className="rounded-full bg-[#fef2f2] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#991b1b]">
                ES périmée
              </span>
            ) : null}
            {post.generationStatus ? (
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                  post.generationStatus === 'done'
                    ? 'bg-[#ecfdf5] text-[#065f46]'
                    : post.generationStatus === 'failed'
                      ? 'bg-[#fef2f2] text-[#991b1b]'
                      : post.generationStatus === 'retrying'
                        ? 'bg-[#eff6ff] text-[#1e3a8a]'
                        : 'bg-[#fff7ed] text-[#9a3412]'
                }`}
              >
                Gen {post.generationStatus}
              </span>
            ) : null}
          </div>

          {post.generationStatus === 'failed' && post.generationError ? (
            <p className="mt-2 text-[11px] text-[#991b1b]">Erreur génération: {post.generationError}</p>
          ) : null}
          {post.network === 'whatsapp' && post.sourceRef ? (
            <p className="mt-2 text-[11px] text-[#065f46]">
              Article lié :{' '}
              <a
                className="underline"
                href={`https://fitmangas.com/blog/${post.sourceRef}`}
                target="_blank"
                rel="noreferrer"
              >
                /blog/{post.sourceRef}
              </a>
            </p>
          ) : null}

          {post.network !== 'linkedin' ? (
            <div className="mt-3 flex flex-wrap gap-4 rounded-2xl border border-[#E8D9C8]/70 bg-[#FBF7F2]/80 px-3 py-2.5">
              {post.network === 'instagram' ? (
                <label className="inline-flex items-center gap-2 text-xs text-luxury-ink">
                  <input
                    type="checkbox"
                    checked={post.alsoPublishFacebook}
                    disabled={pending}
                    onChange={(e) =>
                      run(
                        () => updateSocialPostFacebookMirrorAction(post.id, e.target.checked),
                        e.target.checked ? 'Miroir Facebook activé.' : 'Miroir Facebook désactivé.',
                      )
                    }
                  />
                  Aussi Facebook (même contenu)
                </label>
              ) : null}
              <label className="inline-flex items-center gap-2 text-xs text-luxury-ink">
                <input
                  type="checkbox"
                  checked={hasLinkedInAdaptation}
                  disabled={pending}
                  onChange={(e) =>
                    run(
                      () => toggleLinkedInAdaptationAction(post.id, e.target.checked),
                      e.target.checked ? 'Adaptation LinkedIn créée.' : 'Adaptation LinkedIn retirée.',
                    )
                  }
                />
                Aussi LinkedIn (légende adaptée)
              </label>
            </div>
          ) : null}

          <details className="mt-3">
            <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">
              Options
            </summary>
            <label className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
              Famille / thème (pour régénérer ce post)
            </label>
            <select
              className={`${ADMIN_FIELD_CLASS} mt-1`}
              value={post.pillarId || ''}
              onChange={(e) => {
                const themeId = e.target.value;
                if (!themeId) return;
                const theme = getContentTheme(themeId);
                run(
                  () => updateSocialPostThemeAction(post.id, themeId, theme?.family ?? null),
                  'Thème mis à jour.',
                );
              }}
            >
              <option value="">— Choisir un thème —</option>
              {(['portee', 'confiance', 'conversion'] as ContentFamilyId[]).map((fam) => (
                <optgroup key={fam} label={CONTENT_FAMILY_LABELS[fam]}>
                  {ACTIVE_CONTENT_THEMES.filter((t) => t.family === fam).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {post.pillarId ? (
              <button
                type="button"
                disabled={pending}
                className="btn-luxury-ghost mt-2 min-h-[36px] gap-2 px-3 text-[11px]"
                onClick={() => run(() => regenerateOneSocialPostAction(post.id), 'Post régénéré avec ce thème.')}
              >
                {pending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Régénérer avec ce thème
              </button>
            ) : null}
          </details>

          <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
            Publication (heure Paris)
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <input
              type="date"
              className={`${ADMIN_FIELD_CLASS} max-w-[160px]`}
              defaultValue={parisSchedule.date}
              onBlur={(e) =>
                run(
                  () => updateSocialPostParisScheduleAction(post.id, e.target.value, parisSchedule.hour),
                  'Date Paris mise à jour.',
                )
              }
            />
            <select
              className={`${ADMIN_FIELD_CLASS} max-w-[120px]`}
              defaultValue={String(parisSchedule.hour)}
              onChange={(e) =>
                run(
                  () => updateSocialPostParisScheduleAction(post.id, parisSchedule.date, Number(e.target.value)),
                  'Heure Paris mise à jour.',
                )
              }
            >
              {parisHours.map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}h00
                </option>
              ))}
            </select>
          </div>

          {isReel ? (
            <div className="mt-4 space-y-3">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">
                Overlay vidéo (affiché sur le Reel dans HyperFrames)
              </label>
              <input
                className={ADMIN_FIELD_CLASS}
                key={`hook-${post.id}-${post.updatedAt}`}
                defaultValue={post.overlayText || post.hookTitle}
                placeholder="COURT · COMPLET · lisible en 1s"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  run(async () => {
                    await updateSocialPostOverlayAction(post.id, v, true);
                    await updateSocialPostReelBriefAction(post.id, { hookTitle: v });
                    return { ok: true };
                  }, 'Overlay vidéo enregistré.');
                }}
              />
              <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">
                Brief tournage
              </label>
              <textarea
                rows={8}
                className="w-full rounded-2xl border border-[#E8D9C8]/80 bg-white/90 px-4 py-2 text-sm text-luxury-ink outline-none focus:border-[#C45D3E]/60"
                defaultValue={post.reelScript}
                placeholder={'IDÉES:\n1) …\n2) …\n3) …\n\nBRIEF (à dire naturellement):\n« … »'}
                onBlur={(e) =>
                  run(
                    () => updateSocialPostReelBriefAction(post.id, { reelScript: e.target.value }),
                    'Brief enregistré.',
                  )
                }
              />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  className="btn-luxury-ghost inline-flex min-h-[40px] items-center gap-2 px-3 text-[11px]"
                  // Safari : writeText doit partir dans le geste (pointerdown), avant blur du brief.
                  onPointerDownCapture={(e) => {
                    if (e.button !== 0) return;
                    e.preventDefault();
                    const prompt = buildClaudeCodeReelPrompt({
                      hookTitle: post.hookTitle,
                      overlayText: post.overlayText,
                      title: post.title,
                      reelScript: post.reelScript,
                      caption: post.caption,
                      locale: post.locale,
                      rawVideoPath: post.rawVideoPath,
                    });
                    setClaudePromptError(null);
                    void copyTextFromUserGesture(prompt).then(
                      () => {
                        setClaudePromptCopied(true);
                        setMessage('Prompt Claude Code copié — colle-le dans Claude Code.');
                        window.setTimeout(() => setClaudePromptCopied(false), 2500);
                      },
                      (err: unknown) => {
                        const msg =
                          err instanceof Error
                            ? err.message
                            : 'Copie impossible — autorise le presse-papiers Safari.';
                        setClaudePromptError(msg);
                        setClaudePromptCopied(false);
                        setMessage(msg);
                      },
                    );
                  }}
                >
                  <Copy size={14} />
                  {claudePromptCopied ? 'Copié !' : 'Copier prompt Claude Code'}
                </button>
                {claudePromptError ? (
                  <p className="basis-full text-xs text-red-700">{claudePromptError}</p>
                ) : null}
                <label className="btn-luxury-primary inline-flex min-h-[40px] cursor-pointer items-center gap-2 px-4 text-[11px]">
                  {reelUploadPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {reelUploadPending ? 'Import en cours…' : 'Importer le MP4 monté'}
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    className="hidden"
                    disabled={reelUploadPending || pending}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      const sizeMo = Math.round(file.size / (1024 * 1024));
                      setReelUploadError(null);
                      setReelUploadStatus(`Upload ${sizeMo} Mo en cours… (1 à 2 min)`);
                      startReelUpload(async () => {
                        try {
                          const signRes = await fetch('/api/admin/community/upload-reel', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              postId: post.id,
                              kind: 'edited',
                              fileName: file.name,
                              contentType: file.type || 'video/mp4',
                              byteSize: file.size,
                            }),
                          });
                          let signJson: {
                            ok: boolean;
                            signedUrl?: string;
                            publicUrl?: string;
                            error?: string;
                          };
                          try {
                            signJson = (await signRes.json()) as typeof signJson;
                          } catch {
                            const err = `Signature upload impossible (HTTP ${signRes.status}). Recharge et réessaie.`;
                            setReelUploadStatus(null);
                            setReelUploadError(err);
                            setMessage(err);
                            return;
                          }
                          if (!signJson.ok || !signJson.signedUrl || !signJson.publicUrl) {
                            const err = signJson.error || `Signature upload échouée (HTTP ${signRes.status}).`;
                            setReelUploadStatus(null);
                            setReelUploadError(err);
                            setMessage(err);
                            return;
                          }

                          let putRes: Response;
                          try {
                            putRes = await fetch(signJson.signedUrl, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': file.type || 'video/mp4',
                                'x-upsert': 'true',
                              },
                              body: file,
                            });
                          } catch (err) {
                            const msg = err instanceof Error ? err.message : 'Erreur réseau';
                            const full = `Upload Storage interrompu : ${msg}. Vérifie ta connexion et réessaie.`;
                            setReelUploadStatus(null);
                            setReelUploadError(full);
                            setMessage(full);
                            return;
                          }
                          if (!putRes.ok) {
                            const detail = (await putRes.text().catch(() => '')).slice(0, 400);
                            const sizeHint =
                              putRes.status === 413 ||
                              putRes.status === 400 ||
                              /maximum|size|too large|payload|EntityTooLarge/i.test(detail)
                                ? ` Limite Supabase encore trop basse. Dans le Dashboard Supabase → Storage → Settings : mets « Global file size limit » à 200 MB (ou plus). Puis bucket avatars → Edit → file size 200 MB. Puis réessaie.`
                                : '';
                            const err = `Upload Storage échoué (HTTP ${putRes.status})${detail ? ` : ${detail}` : ''}.${sizeHint}`;
                            setReelUploadStatus(null);
                            setReelUploadError(err);
                            setMessage(err);
                            return;
                          }

                          const attached = await attachSocialEditedVideoAction(post.id, signJson.publicUrl);
                          if (!attached.ok) {
                            setReelUploadStatus(null);
                            setReelUploadError(attached.error || 'Enregistrement post échoué.');
                            setMessage(attached.error || 'Enregistrement post échoué.');
                            return;
                          }
                          setLocalEditedVideo(signJson.publicUrl);
                          setReelUploadStatus(null);
                          setReelUploadError(null);
                          setMessage(attached.message || `MP4 monté importé (${sizeMo} Mo) — aperçu dispo à gauche.`);
                          router.refresh();
                        } catch (err) {
                          const msg = err instanceof Error ? err.message : 'Import MP4 impossible.';
                          setReelUploadStatus(null);
                          setReelUploadError(msg);
                          setMessage(msg);
                        }
                      });
                    }}
                  />
                </label>
                {reelUploadStatus ? (
                  <p className="basis-full text-xs text-luxury-soft">{reelUploadStatus}</p>
                ) : null}
                {reelUploadError ? (
                  <p className="basis-full text-xs text-red-700">{reelUploadError}</p>
                ) : null}
                {(localEditedVideo || post.editedVideoPath) ? (
                  <>
                    <button
                      type="button"
                      className="btn-luxury-ghost inline-flex min-h-[40px] items-center gap-2 px-3 text-[11px]"
                      onClick={() => onPreview(0)}
                    >
                      <Eye size={14} />
                      Prévisualiser
                    </button>
                    <a
                      href={localEditedVideo || post.editedVideoPath || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-luxury-ghost inline-flex min-h-[40px] items-center gap-2 px-3 text-[11px]"
                    >
                      <Download size={14} />
                      Voir le MP4
                    </a>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {!isReel && post.imagePath ? (
            <div className="mt-3">
              <button
                type="button"
                className="btn-luxury-ghost inline-flex min-h-[40px] items-center gap-2 px-3 text-[11px]"
                onClick={() => void downloadSocialPostImage(post).catch(() => setMessage('Export image impossible.'))}
              >
                <Download size={14} />
                Télécharger le visuel
              </button>
            </div>
          ) : null}
          {!isReel && !post.imagePath ? (
            <p className="mt-3 text-xs text-luxury-muted">Visuel manquant — regénère la semaine ou choisis une photo bibliothèque.</p>
          ) : null}

          {showAiImageTools ? (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  className="btn-luxury-ghost inline-flex min-h-[40px] items-center gap-2 px-3 text-[11px]"
                  title="Régénère une image de zéro (Nano Banana 2)"
                  onClick={() =>
                    run(
                      async () => {
                        if (feedback.trim()) {
                          await updateSocialPostImageFeedbackAction(post.id, feedback);
                        }
                        return generateSocialImageAction(post.id, feedback);
                      },
                      'Visuel Nano Banana 2…',
                    )
                  }
                >
                  {pending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Nano Banana 2{useDouble ? ' + Double' : ''}
                </button>
              </div>
              <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
                Corrections visuel (image-to-image)
              </label>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-start">
                <textarea
                  rows={2}
                  className="w-full flex-1 rounded-2xl border border-[#D9C9B4] bg-white px-4 py-2 text-sm text-luxury-ink outline-none focus:border-[#C45D3E]/60"
                  placeholder={
                    postLocale === 'es'
                      ? 'Ej.: manos demasiado visibles, color saturado, encuadre cerrado…'
                      : 'Ex. : mains trop visibles, couleur trop saturée, cadrage trop serré…'
                  }
                  value={feedback}
                  onChange={(e) => onFeedbackChange(e.target.value)}
                  onBlur={() =>
                    run(() => updateSocialPostImageFeedbackAction(post.id, feedback), 'Feedback enregistré.')
                  }
                />
                <button
                  type="button"
                  disabled={pending || !feedback.trim() || !post.imagePath}
                  className="btn-luxury-primary inline-flex min-h-[40px] shrink-0 items-center gap-2 px-3 text-[11px] disabled:opacity-50"
                  title="Applique la correction sur l’image actuelle"
                  onClick={() =>
                    run(
                      async () => {
                        await updateSocialPostImageFeedbackAction(post.id, feedback);
                        return refineSocialImageAction(post.id, feedback);
                      },
                      'Correction appliquée…',
                    )
                  }
                >
                  Appliquer la correction
                </button>
              </div>
            </>
          ) : null}

          {!isReel ? (
            <>
              <details className="mt-3">
                <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">
                  Remplacer par bibliothèque (optionnel)
                </summary>
                <select
                  className={`${ADMIN_FIELD_CLASS} mt-2`}
                  value={post.imagePath || ''}
                  onChange={(e) => run(() => updateSocialPostImageAction(post.id, e.target.value || null), 'Image mise à jour.')}
                >
                  <option value="">— Choisir —</option>
                  {imageOptionsForPost(post).map((path) => (
                    <option key={path} value={path}>
                      {path.startsWith('http') ? `IA · ${path.split('/').pop()?.slice(0, 24)}…` : path.split('/').pop()}
                    </option>
                  ))}
                </select>
              </details>

              {isCarousel && post.carouselPaths?.length ? (
                <p className="mt-2 text-[11px] text-luxury-soft">
                  {post.carouselPaths.length} slides — utilise ← → ou les miniatures à gauche pour tout valider.
                </p>
              ) : null}

              <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
                Texte sur image
              </label>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs text-luxury-muted">
                  <input
                    type="checkbox"
                    checked={post.useOverlay}
                    onChange={(e) =>
                      run(
                        () => updateSocialPostOverlayAction(post.id, post.overlayText || post.title, e.target.checked),
                        'Overlay mis à jour.',
                      )
                    }
                  />
                  Activer
                </label>
                <input
                  key={`ov-${post.id}-${post.updatedAt}`}
                  className={`${ADMIN_FIELD_CLASS} max-w-sm`}
                  defaultValue={post.overlayText || ''}
                  placeholder="Texte sur image (court, complet)"
                  disabled={!post.useOverlay}
                  onBlur={(e) => {
                    if (e.target.value === (post.overlayText || '')) return;
                    run(() => updateSocialPostOverlayAction(post.id, e.target.value, post.useOverlay), 'Texte sur image enregistré.');
                  }}
                />
              </div>
              {isCarousel && post.carouselSlideTitles?.length ? (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
                    Titres des 7 slides
                  </p>
                  <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-[12px] text-luxury-ink">
                    {post.carouselSlideTitles.map((t, i) => (
                      <li key={`${post.id}-slide-title-${i}`}>{t || `— slide ${i + 1}`}</li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </>
          ) : null}

          <label className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
            Description Instagram (légende + CTA en dernière ligne)
          </label>
          <textarea
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            rows={isReel ? 3 : post.format === 'feed' || post.format === 'carousel' ? 10 : 5}
            className="mt-1 w-full rounded-2xl border border-[#D9C9B4] bg-white px-4 py-3 text-sm text-luxury-ink outline-none focus:border-[#C45D3E]/60 focus:ring-2 focus:ring-[#C45D3E]/25"
            onBlur={() => {
              if (caption === post.caption) return;
              run(async () => {
                await updateSocialPostCaptionAction(post.id, caption);
                return { ok: true };
              }, 'Légende enregistrée.');
            }}
          />
          <p className={`mt-1 text-xs ${captionAnalysis.ok ? 'text-luxury-soft' : 'text-[#7a2e1a]'}`}>
            {captionAnalysis.length} / {captionAnalysis.idealMin}–{captionAnalysis.idealMax}{' '}
            {captionAnalysis.unitLabel}
            {captionAnalysis.warnings.length ? ` — ${captionAnalysis.warnings.join(' ')}` : ''}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={pending}
              className="btn-luxury-ghost min-h-[40px] gap-2 px-4 text-[11px]"
              title="Régénère ce post seul (garde slot, pilier, langue, date)"
              onClick={() => run(() => regenerateOneSocialPostAction(post.id), 'Post régénéré.')}
            >
              {pending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Régénérer ce post
            </button>
            {postLocale === 'fr' ? (
              <button
                type="button"
                disabled={pending}
                className="btn-luxury-ghost min-h-[40px] gap-2 px-4 text-[11px]"
                title="Crée la variante ES en réutilisant l’image"
                onClick={() => run(() => generateSpanishVariantAction(post.id), 'Variante ES créée.')}
              >
                Générer en espagnol
              </button>
            ) : null}
            <button type="button" disabled={pending} onClick={onCopy} className="btn-luxury-ghost min-h-[40px] gap-2 px-4 text-[11px]">
              {copiedId === post.id ? <Check size={14} /> : <Copy size={14} />}
              Copier
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await updateSocialPostCaptionAction(post.id, caption);
                  return { ok: true };
                }, 'Légende enregistrée.')
              }
              className="btn-luxury-ghost min-h-[40px] px-4 text-[11px]"
            >
              Enregistrer
            </button>
            {canPublishMeta ? (
              <button
                type="button"
                disabled={pending || (isReel && !post.editedVideoPath) || post.status === 'published'}
                title={
                  post.status === 'published'
                    ? 'Ce post est déjà publié.'
                    : isReel && !post.editedVideoPath
                      ? 'Importe le MP4 monté avant de publier ce Reel.'
                      : undefined
                }
                onClick={() =>
                  run(async () => {
                    const result = await publishSocialPostNowAction(post.id);
                    if (result.ok) {
                      setActionFeedback({
                        kind: 'published',
                        message: result.message || 'Publié sur Meta.',
                      });
                      onWorkflowTabChange('archives');
                      window.setTimeout(() => {
                        document.getElementById(`post-${post.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 150);
                    }
                    return result;
                  }, post.network === 'instagram' && post.alsoPublishFacebook
                    ? 'Publié sur Instagram (+ Facebook si OK).'
                    : 'Publié sur Meta.')
                }
                className={`inline-flex min-h-[40px] items-center gap-2 px-4 text-[11px] disabled:opacity-60 ${
                  justPublished || post.status === 'published' ? 'rounded-full bg-[#059669] text-white' : 'btn-luxury-primary'
                }`}
              >
                {justPublished || post.status === 'published' ? <CheckCircle2 size={14} /> : <Send size={14} />}
                {justPublished
                  ? 'Publié ✓'
                  : post.status === 'published'
                    ? 'Publié'
                    : post.network === 'instagram' && post.alsoPublishFacebook
                      ? 'Publier IG + FB'
                      : 'Publier'}
              </button>
            ) : null}
            {canPublishMeta && post.status === 'published' && post.alsoPublishFacebook ? (
              post.facebookExternalId ? (
                <a
                  href={facebookPermalinkUrl(post.facebookExternalId, post.format)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#1877F2]/30 bg-[#e8f0fe] px-4 text-[11px] font-semibold text-[#1877F2]"
                >
                  Voir sur Facebook
                </a>
              ) : (
                <button
                  type="button"
                  disabled={pending || (isReel && !post.editedVideoPath)}
                  title="Publie le miroir Facebook (une seule fois — pas de republier)"
                  onClick={() =>
                    run(async () => {
                      const result = await publishFacebookMirrorNowAction(post.id);
                      if (result.ok) {
                        setActionFeedback({
                          kind: 'published',
                          message: result.message || 'Miroir Facebook publié.',
                        });
                        onWorkflowTabChange('archives');
                      }
                      return result;
                    }, 'Miroir Facebook publié.')
                  }
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#1877F2]/30 bg-[#e8f0fe] px-4 text-[11px] font-semibold text-[#1877F2] disabled:opacity-60"
                >
                  <Send size={14} />
                  Publier miroir FB
                </button>
              )
            ) : null}
            {isTikTok ? (
              <button
                type="button"
                disabled
                title="Publication TikTok bientôt disponible"
                className="btn-luxury-ghost inline-flex min-h-[40px] items-center gap-2 px-4 text-[11px] opacity-60"
              >
                Bientôt
              </button>
            ) : null}
            {isManualNetwork ? (
              <button
                type="button"
                disabled={pending || Boolean(post.manualSentAt)}
                onClick={() =>
                  run(() => markSocialPostManualSentAction(post.id), 'Marqué comme envoyé.')
                }
                className="btn-luxury-ghost min-h-[40px] px-4 text-[11px] disabled:opacity-60"
              >
                {post.manualSentAt ? 'Envoyé ✓' : 'Marquer envoyé'}
              </button>
            ) : null}
            <button
              type="button"
              disabled={pending || post.status === 'published'}
              title={post.status === 'published' ? 'Post déjà publié — reprogrammation impossible.' : undefined}
              onClick={() =>
                run(async () => {
                  const result = await scheduleSocialPostAction(post.id);
                  if (result.ok) {
                    setActionFeedback({
                      kind: 'scheduled',
                      message: result.message || 'Post programmé.',
                    });
                    onWorkflowTabChange('programmes');
                    window.setTimeout(() => {
                      document.getElementById(`post-${post.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 150);
                  }
                  return result;
                }, 'Post programmé.')
              }
              className={`min-h-[40px] px-4 text-[11px] disabled:opacity-60 ${
                justScheduled || post.status === 'scheduled'
                  ? 'inline-flex items-center gap-2 rounded-full border border-[#93c5fd] bg-[#dbeafe] font-semibold text-[#1e40af]'
                  : 'btn-luxury-ghost'
              }`}
            >
              {justScheduled ? (
                <>
                  <Check size={14} />
                  Programmé ✓
                </>
              ) : post.status === 'scheduled' ? (
                <>
                  <CalendarClock size={14} />
                  Programmé
                </>
              ) : (
                'Programmer'
              )}
            </button>
            <select
              className={`${ADMIN_FIELD_CLASS} min-h-[40px] max-w-[180px] text-[11px]`}
              value={post.status}
              title="Statut interne du post (suivi workflow)"
              onChange={(e) =>
                run(
                  () => updateSocialPostStatusAction(post.id, e.target.value as SocialPost['status']),
                  'Statut mis à jour.',
                )
              }
            >
              {statusOptionsForFormat(post.format).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => deleteSocialPostAction(post.id), 'Post supprimé.')}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-800"
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
        active
          ? 'bg-[#c45d3e] text-white shadow-[0_8px_18px_rgba(196,93,62,0.28)]'
          : 'border border-white/70 bg-white/80 text-luxury-muted hover:text-luxury-ink'
      }`}
    >
      {label}
    </button>
  );
}
