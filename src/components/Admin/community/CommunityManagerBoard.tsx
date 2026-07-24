'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  CalendarDays,
  Check,
  CircleHelp,
  Copy,
  Download,
  Eye,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

import {
  attachSocialEditedVideoAction,
  deleteSocialPostAction,
  disconnectMetaAction,
  generateSocialImageAction,
  generateSocialWeekPlanAction,
  getMetaConnectUrlAction,
  markAllSocialPostsReadyAction,
  publishSocialPostNowAction,
  saveMetaConnectionManualAction,
  scheduleSocialPostAction,
  updateSocialPostCaptionAction,
  updateSocialPostImageAction,
  updateSocialPostImageFeedbackAction,
  updateSocialPostOverlayAction,
  updateSocialPostParisScheduleAction,
  updateSocialPostReelBriefAction,
  updateSocialPostStatusAction,
} from '@/app/admin/community/actions';
import {
  analyzeCaptionForPost,
  CM_STRATEGY_NOTES,
  formatBestHours,
  monthGridDays,
  SOCIAL_CM_GUIDELINES,
} from '@/lib/admin/social-cm-playbook';
import { allowedParisHours, parseParisSchedule } from '@/lib/admin/social-paris-time';
import { downloadSocialPostImage, renderSocialPostDataUrl } from '@/lib/admin/social-image-render';
import { resolveGenerationNetworks, weekPlanSummary } from '@/lib/admin/social-week-planner';
import {
  localDayKey,
  SOCIAL_LIBRARY_IMAGES,
  SOCIAL_NETWORK_LABELS,
  SOCIAL_STATUS_LABELS,
  startOfWeekMonday,
  type MetaSocialConnection,
  type SocialCommsBoard,
  type SocialNetwork,
  type SocialPost,
} from '@/lib/admin/social-comms';
import { ADMIN_FIELD_CLASS } from '@/components/Admin/adminSurfaceClasses';

const NETWORKS: SocialNetwork[] = ['instagram', 'whatsapp', 'facebook', 'tiktok'];

function buildCopyText(post: SocialPost) {
  const hashtags = post.hashtags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)).join(' ');
  return [post.caption, post.cta, hashtags].filter(Boolean).join('\n\n');
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
};

export function CommunityManagerBoard({ board, meta, metaAppReady }: Props) {
  const router = useRouter();
  const [networkFilter, setNetworkFilter] = useState<SocialNetwork | 'all'>('all');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('month');
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [draftCaptions, setDraftCaptions] = useState<Record<string, string>>({});
  const [draftFeedback, setDraftFeedback] = useState<Record<string, string>>({});
  const [previewPost, setPreviewPost] = useState<SocialPost | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showMetaPanel, setShowMetaPanel] = useState(false);
  const [showStrategyPanel, setShowStrategyPanel] = useState(false);
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
    const filtered =
      networkFilter === 'all' ? board.posts : board.posts.filter((post) => post.network === networkFilter);
    return [...filtered].sort((a, b) => {
      const aTime = a.plannedAt ? new Date(a.plannedAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.plannedAt ? new Date(b.plannedAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
  }, [board.posts, networkFilter]);

  const counts = useMemo(() => {
    return NETWORKS.reduce(
      (acc, network) => {
        acc[network] = board.posts.filter((post) => post.network === network && post.status !== 'skipped').length;
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
    if (!previewPost?.imagePath) {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    void renderSocialPostDataUrl(previewPost)
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
  }, [previewPost]);

  function run(action: () => Promise<{ ok: boolean; error?: string; message?: string }>, successMessage: string) {
    setMessage('');
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setMessage(result.error || 'Action impossible.');
        return;
      }
      setMessage(result.message || successMessage);
      router.refresh();
    });
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
            <p className="mt-2 max-w-2xl text-sm leading-6 text-luxury-muted">
              {networkFilter === 'all'
                ? 'Génération multi-réseaux avec horaires Paris, mix Reels/feed et images IA automatiques.'
                : `Mode ${SOCIAL_NETWORK_LABELS[networkFilter]} — ${generationSummary}`}
            </p>
            {board.lastGeneratedAt ? (
              <p className="mt-2 text-xs text-luxury-soft">
                Dernière génération IA : {new Date(board.lastGeneratedAt).toLocaleString('fr-FR')}
              </p>
            ) : null}
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
                run(
                  () => generateSocialWeekPlanAction(generationNetworks),
                  `Plan ${networkFilter === 'all' ? 'multi-réseaux' : SOCIAL_NETWORK_LABELS[networkFilter as SocialNetwork]} généré.`,
                )
              }
              className="btn-luxury-primary inline-flex min-h-[44px] items-center gap-2 px-5 text-xs disabled:opacity-60"
            >
              {pending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {pending
                ? 'Génération…'
                : networkFilter === 'all'
                  ? 'Générer la semaine'
                  : `Générer ${SOCIAL_NETWORK_LABELS[networkFilter]}`}
            </button>
            {pending ? (
              <p className="w-full text-xs text-luxury-soft">
                Textes + briefs Reels + photos ({generationSummary}) — compte ~1–3 min.
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <FilterChip active={networkFilter === 'all'} onClick={() => setNetworkFilter('all')} label={`Tous (${board.posts.length})`} />
          {NETWORKS.map((network) => (
            <FilterChip
              key={network}
              active={networkFilter === network}
              onClick={() => setNetworkFilter(network)}
              label={`${SOCIAL_NETWORK_LABELS[network]} (${counts[network]})`}
            />
          ))}
          <button
            type="button"
            title="Stratégie CM"
            aria-label="Ouvrir la stratégie community manager"
            onClick={() => setShowStrategyPanel(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E8D9C8] bg-white text-[#7a2e1a] shadow-sm transition hover:border-[#C45D3E]/50 hover:bg-[#FBF7F2]"
          >
            <CircleHelp size={16} strokeWidth={2} />
          </button>
          <span className="text-[10px] text-luxury-muted">
            Meta {meta.connected ? '· connecté' : '· à connecter'}
            <button type="button" className="ml-1 underline decoration-[#C45D3E]/40" onClick={() => setShowMetaPanel((v) => !v)}>
              {showMetaPanel ? 'masquer' : 'régler'}
            </button>
          </span>
        </div>

        {showMetaPanel ? (
          <div className="mt-3 max-w-xl rounded-2xl border border-[#E8D9C8]/80 bg-white/80 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a2e1a]">Meta IG/FB</p>
            <p className="mt-1 text-[11px] text-luxury-muted">
              {meta.connected
                ? `${meta.pageName || meta.pageId}${meta.igUsername ? ` · @${meta.igUsername}` : ''}`
                : 'Token Page ou OAuth'}
            </p>
            <div className="mt-2 space-y-2">
              <input className={ADMIN_FIELD_CLASS} placeholder="Page ID" value={tokenForm.pageId} onChange={(e) => setTokenForm((s) => ({ ...s, pageId: e.target.value }))} />
              <input className={ADMIN_FIELD_CLASS} placeholder="IG User ID" value={tokenForm.igUserId} onChange={(e) => setTokenForm((s) => ({ ...s, igUserId: e.target.value }))} />
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

        {showStrategyPanel ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" role="dialog" aria-modal="true">
            <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#E8D9C8] bg-[#FFFAF5] p-5 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7a2e1a]">Stratégie CM</p>
                  <h3 className="mt-1 text-lg font-semibold text-luxury-ink">Mix & horaires Paris</h3>
                </div>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E8D9C8] bg-white"
                  onClick={() => setShowStrategyPanel(false)}
                  aria-label="Fermer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {NETWORKS.map((network) => {
                  const g = SOCIAL_CM_GUIDELINES[network];
                  return (
                    <div key={network} className="rounded-2xl bg-white/80 px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7a2e1a]">{g.label}</p>
                      <p className="mt-0.5 text-[11px] text-luxury-muted">{formatBestHours(network)}</p>
                      <p className="mt-1 text-[12px] leading-5 text-luxury-soft">{g.weeklyTarget}</p>
                    </div>
                  );
                })}
              </div>
              <ul className="mt-4 space-y-1.5 text-[12px] leading-snug text-luxury-soft">
                {CM_STRATEGY_NOTES.map((n) => (
                  <li key={n}>• {n}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {message ? <p className="mt-4 text-sm text-luxury-muted">{message}</p> : null}
      </section>

      <section className="rounded-[2rem] border border-white/65 bg-white/70 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-[#C45D3E]" />
            <h2 className="text-lg font-semibold text-luxury-ink">
              {calendarView === 'month' ? 'Calendrier du mois' : 'Calendrier de la semaine'}
            </h2>
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

        {calendarView === 'week' ? (
          <div className="mt-4 grid gap-2 md:grid-cols-7">
            {weekDays.map((day) => {
              const key = localDayKey(day);
              const dayPosts = posts.filter((post) => post.plannedAt && localDayKey(new Date(post.plannedAt)) === key);
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
                const dayPosts = posts.filter((post) => post.plannedAt && localDayKey(new Date(post.plannedAt)) === key);
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
        {posts.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-[#C45D3E]/25 bg-white/55 px-5 py-10 text-center text-sm text-luxury-muted">
            Aucun post. Clique sur « Générer la semaine ».
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              caption={draftCaptions[post.id] ?? post.caption}
              feedback={draftFeedback[post.id] ?? post.imageFeedback}
              pending={pending}
              copiedId={copiedId}
              onCaptionChange={(value) => setDraftCaptions((c) => ({ ...c, [post.id]: value }))}
              onFeedbackChange={(value) => setDraftFeedback((c) => ({ ...c, [post.id]: value }))}
              onPreview={() => setPreviewPost(post)}
              onCopy={() => void copyPost(post)}
              run={run}
              setMessage={setMessage}
            />
          ))
        )}
      </section>

      {previewPost ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewPost(null)}
        >
          <div
            className="relative max-h-[92vh] max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white"
              onClick={() => setPreviewPost(null)}
            >
              <X size={18} />
            </button>
            {previewLoading ? (
              <div className="flex h-[480px] w-[384px] items-center justify-center">
                <Loader2 className="animate-spin text-[#C45D3E]" size={32} />
              </div>
            ) : previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Aperçu publication" className="max-h-[92vh] w-full object-contain" />
            ) : (
              <div className="flex h-64 w-80 items-center justify-center text-sm text-luxury-muted">Aperçu indisponible</div>
            )}
            <p className="border-t border-black/5 px-4 py-3 text-center text-xs text-luxury-muted">
              Aperçu final avec logo{previewPost.useOverlay ? ' et texte overlay' : ''}.
            </p>
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
      className={`${compact ? 'min-h-[88px]' : 'min-h-[140px]'} rounded-2xl border border-white/70 p-2 ${muted ? 'bg-white/30 opacity-60' : 'bg-white/60'}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
        {compact
          ? day.getDate()
          : day.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
      </p>
      <div className="mt-1 space-y-1">
        {dayPosts.map((post) => (
          <a
            key={post.id}
            href={`#post-${post.id}`}
            className="block rounded-lg bg-[#fff4ee] px-1.5 py-1 text-[9px] font-semibold leading-tight text-[#7a2e1a]"
          >
            {SOCIAL_NETWORK_LABELS[post.network].slice(0, 2)} · {post.title.slice(0, compact ? 18 : 28)}
          </a>
        ))}
        {dayPosts.length === 0 && !compact ? <p className="text-[10px] text-luxury-muted">—</p> : null}
      </div>
    </div>
  );
}

function PostCard({
  post,
  caption,
  feedback,
  pending,
  copiedId,
  onCaptionChange,
  onFeedbackChange,
  onPreview,
  onCopy,
  run,
  setMessage,
}: {
  post: SocialPost;
  caption: string;
  feedback: string;
  pending: boolean;
  copiedId: string | null;
  onCaptionChange: (value: string) => void;
  onFeedbackChange: (value: string) => void;
  onPreview: () => void;
  onCopy: () => void;
  run: (action: () => Promise<{ ok: boolean; error?: string; message?: string }>, successMessage: string) => void;
  setMessage: (msg: string) => void;
}) {
  const captionAnalysis = analyzeCaptionForPost(caption, post.network, post.format, post.hashtags.length);
  const canPublishMeta = post.network === 'instagram' || post.network === 'facebook';
  const parisSchedule = parseParisSchedule(post.plannedAt);
  const parisHours = allowedParisHours(post.network);
  const isReel = post.format === 'reel';
  const isCarousel = post.format === 'carousel';
  const showAiImageTools = !isReel && (post.imageSource === 'ai' || post.imageSource === 'pollinations');
  const previewVideo = post.editedVideoPath || post.rawVideoPath;
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
    <article id={`post-${post.id}`} className="overflow-hidden rounded-[1.5rem] border border-[#E8D9C8]/50 bg-white/80 shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[200px_minmax(0,1fr)]">
        <div className="group relative min-h-[220px] bg-brand-beige">
          {isReel && previewVideo ? (
            <video src={previewVideo} className="absolute inset-0 h-full w-full object-cover" muted playsInline controls />
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
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/45 px-2 py-1.5">
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
              </div>
              <div className="flex gap-1 overflow-x-auto bg-white/90 p-1.5">
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
              {post.useOverlay ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-center font-serif text-sm italic text-white">{post.overlayText || post.title}</p>
                </div>
              ) : null}
              <button
                type="button"
                onClick={onPreview}
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
            <div className="flex h-full min-h-[200px] items-center justify-center px-4 text-center text-xs text-luxury-muted">
              {isReel ? 'Brief Reel — upload une vidéo' : isCarousel ? 'Carousel — slides à préparer' : 'Visuel manquant'}
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#fff4ee] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a2e1a]">
              {SOCIAL_NETWORK_LABELS[post.network]}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
              {post.format}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
              {SOCIAL_STATUS_LABELS[post.status]}
            </span>
            {isReel && post.videoStatus ? (
              <span className="rounded-full bg-[#fff0e8] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a2e1a]">
                {videoStatusLabel[post.videoStatus] || post.videoStatus}
              </span>
            ) : null}
            {post.imageSource === 'library' ? (
              <span className="rounded-full bg-[#f7f3ee] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
                Bibliothèque
              </span>
            ) : null}
            {post.imageSource === 'ai' ? (
              <span className="rounded-full bg-[#eef8ff] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1a4a7a]">
                Gemini
              </span>
            ) : null}
            {post.imageSource === 'unsplash' ? (
              <span className="rounded-full bg-[#f0faf0] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1a5a2a]">
                Unsplash
              </span>
            ) : null}
            {post.imageSource === 'pollinations' ? (
              <span className="rounded-full bg-[#faf5ff] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a1a7a]">
                Pollinations
              </span>
            ) : null}
          </div>

          <h2 className="mt-3 text-lg font-semibold text-luxury-ink">{post.title}</h2>
          {post.whyItWorks ? <p className="mt-1 text-[11px] leading-snug text-luxury-soft">{post.whyItWorks}</p> : null}

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
                Gros titre (idée 0–2 s)
              </label>
              <input
                className={ADMIN_FIELD_CLASS}
                defaultValue={post.hookTitle}
                placeholder="Ex. : Arrête de forcer ton dos"
                onBlur={(e) =>
                  run(
                    () => updateSocialPostReelBriefAction(post.id, { hookTitle: e.target.value }),
                    'Titre Reel enregistré.',
                  )
                }
              />
              <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">
                Aide-mémoire (3 idées — généré auto)
              </label>
              <textarea
                rows={3}
                className="w-full rounded-2xl border border-[#E8D9C8]/80 bg-white/90 px-4 py-2 text-sm text-luxury-ink outline-none focus:border-[#C45D3E]/60"
                defaultValue={post.reelScript}
                placeholder="1) … 2) … 3) …"
                onBlur={(e) =>
                  run(
                    () => updateSocialPostReelBriefAction(post.id, { reelScript: e.target.value }),
                    'Brief enregistré.',
                  )
                }
              />
              <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">
                Plan de tournage (généré auto)
              </label>
              <textarea
                rows={2}
                className="w-full rounded-2xl border border-[#E8D9C8]/80 bg-white/90 px-4 py-2 text-sm text-luxury-ink outline-none focus:border-[#C45D3E]/60"
                defaultValue={post.shotList}
                placeholder="Face cam…"
                onBlur={(e) =>
                  run(
                    () => updateSocialPostReelBriefAction(post.id, { shotList: e.target.value }),
                    'Shot list enregistrée.',
                  )
                }
              />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  className="btn-luxury-ghost inline-flex min-h-[40px] items-center gap-2 px-3 text-[11px]"
                  onClick={() => {
                    const prompt = [
                      'Méthode LMDM / FitMangas — monte cette vidéo en suivant STRICTEMENT mes skills (dossier FitMangas-Reels/skills/ ou reel-monteur-fitmangas/skills/).',
                      'Lis aussi CLAUDE.md + STRATEGY.md si présents.',
                      '',
                      'Vidéo brute : [COLLE ICI LE CHEMIN DU FICHIER .mp4 ou .MOV]',
                      '',
                      'Brief FitMangas (AIDE-MÉMOIRE uniquement — PAS un script à sous-titrer) :',
                      `- Hook / sujet : ${post.hookTitle || post.title}`,
                      `- 3 idées max :`,
                      post.reelScript || '—',
                      `- Plans :`,
                      post.shotList || '—',
                      `- Légende cible : ${post.caption || '—'}`,
                      '',
                      'RÈGLE PAROLE NATURELLE :',
                      '- Ne force AUCUN sous-titre depuis ce brief.',
                      '- Transcris la VOIX RÉELLE (Whisper local). Sous-titres = ce qui a été prononcé.',
                      '- Bafouillages / reprises : dérush = garder la meilleure prise orale.',
                      '',
                      'Pipeline obligatoire :',
                      '0) Dérush : Whisper local + ffmpeg silencedetect (coupes DANS les silences).',
                      '1) Sections à partir de la transcription réelle.',
                      '2) Motion : Follow @fit.mangas + CTA pile 3 cartes (dashboard/blog/replays) — skills/03.',
                      '3) Sous-titres 2–3 mots sync voix (style intangible).',
                      '4) Attends mon OK section par section avant export.',
                      '5) Audio : musique ~15 dB sous la voix (sauf si je demande son d’origine). Pas de RNNoise.',
                      '6) Export MP4 1080x1920 LOCAL H.264 SDR — INTERDIT cloud HeyGen.',
                      '',
                      'Si quelque chose bloque, répare-toi-même. Dis-moi quand l’aperçu local est prêt.',
                    ].join('\n');
                    void navigator.clipboard.writeText(prompt).then(
                      () => setMessage('Prompt Claude Code copié — colle-le dans Claude Code.'),
                      () => setMessage('Impossible de copier.'),
                    );
                  }}
                >
                  <Copy size={14} />
                  Copier prompt Claude Code
                </button>
                <label className="btn-luxury-primary inline-flex min-h-[40px] cursor-pointer items-center gap-2 px-4 text-[11px]">
                  {pending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Importer le MP4 monté
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    className="hidden"
                    disabled={pending}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      run(async () => {
                        const body = new FormData();
                        body.append('file', file);
                        body.append('postId', post.id);
                        body.append('kind', 'edited');
                        const res = await fetch('/api/admin/community/upload-reel', { method: 'POST', body });
                        const json = (await res.json()) as { ok: boolean; url?: string; error?: string };
                        if (!json.ok || !json.url) return { ok: false, error: json.error || 'Upload échoué.' };
                        return attachSocialEditedVideoAction(post.id, json.url);
                      }, 'MP4 monté importé.');
                    }}
                  />
                </label>
                {post.editedVideoPath ? (
                  <a
                    href={post.editedVideoPath}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-luxury-ghost inline-flex min-h-[40px] items-center gap-2 px-3 text-[11px]"
                  >
                    <Download size={14} />
                    Voir le MP4
                  </a>
                ) : null}
              </div>
              <p className="text-[10px] leading-snug text-luxury-muted">
                Workflow : filmer (aide-mémoire) → Claude Code (prompt ci-dessus) → importer le MP4 ici → statut Prêt / Programmer.
              </p>
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
              <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
                Corrections visuel IA
              </label>
              <textarea
                rows={2}
                className="w-full rounded-2xl border border-[#D9C9B4] bg-white px-4 py-2 text-sm text-luxury-ink outline-none focus:border-[#C45D3E]/60"
                placeholder="Ex. : mains trop visibles, couleur trop saturée, cadrage trop serré…"
                value={feedback}
                onChange={(e) => onFeedbackChange(e.target.value)}
                onBlur={() =>
                  run(() => updateSocialPostImageFeedbackAction(post.id, feedback), 'Feedback enregistré.')
                }
              />
              {feedback.trim() ? (
                <button
                  type="button"
                  disabled={pending}
                  className="btn-luxury-ghost mt-2 inline-flex min-h-[40px] items-center gap-2 px-3 text-[11px]"
                  onClick={() =>
                    run(async () => {
                      await updateSocialPostImageFeedbackAction(post.id, feedback);
                      return generateSocialImageAction(post.id, feedback);
                    }, 'Regénération image…')
                  }
                >
                  {pending ? <Loader2 size={14} className="animate-spin" /> : null}
                  Regénérer l&apos;image IA
                </button>
              ) : null}
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

              <div className="mt-3 flex flex-wrap items-center gap-3">
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
                  Texte sur image
                </label>
                <input
                  className={`${ADMIN_FIELD_CLASS} max-w-sm`}
                  defaultValue={post.overlayText || ''}
                  placeholder="Texte overlay"
                  disabled={!post.useOverlay}
                  onBlur={(e) =>
                    run(() => updateSocialPostOverlayAction(post.id, e.target.value, post.useOverlay), 'Texte overlay enregistré.')
                  }
                />
              </div>
              {!post.useOverlay ? (
                <p className="mt-1 text-[11px] text-luxury-soft">Sans overlay : seul le logo FitMangas sera ajouté à l’export.</p>
              ) : null}
            </>
          ) : null}

          <textarea
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            rows={isReel ? 3 : 5}
            className="mt-4 w-full rounded-2xl border border-[#D9C9B4] bg-white px-4 py-3 text-sm text-luxury-ink outline-none focus:border-[#C45D3E]/60 focus:ring-2 focus:ring-[#C45D3E]/25"
          />
          <p className={`mt-1 text-xs ${captionAnalysis.ok ? 'text-luxury-soft' : 'text-[#7a2e1a]'}`}>
            {captionAnalysis.length} / {captionAnalysis.max} car. (idéal {captionAnalysis.idealMin}–{captionAnalysis.idealMax})
            {captionAnalysis.warnings.length ? ` — ${captionAnalysis.warnings.join(' ')}` : ''}
          </p>
          {post.cta ? <p className="mt-2 text-xs font-medium text-[#7a2e1a]">CTA : {post.cta}</p> : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
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
                disabled={pending}
                onClick={() => run(() => publishSocialPostNowAction(post.id), 'Publié sur Meta.')}
                className="btn-luxury-primary inline-flex min-h-[40px] items-center gap-2 px-4 text-[11px]"
              >
                <Send size={14} />
                Publier
              </button>
            ) : null}
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => scheduleSocialPostAction(post.id), 'Post programmé.')}
              className="btn-luxury-ghost min-h-[40px] px-4 text-[11px]"
            >
              Programmer
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
              <option value="idea">Idée — à filmer / préparer</option>
              <option value="ready">Prêt — MP4 ou visuel OK</option>
              <option value="scheduled">Programmé — en file</option>
              <option value="published">Publié (manuel)</option>
              <option value="skipped">Ignoré</option>
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
