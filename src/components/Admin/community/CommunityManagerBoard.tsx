'use client';

import Image from 'next/image';
import { useMemo, useState, useTransition } from 'react';
import {
  CalendarDays,
  Check,
  Copy,
  Download,
  Loader2,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';

import {
  deleteSocialPostAction,
  disconnectMetaAction,
  generateSocialWeekPlanAction,
  getMetaConnectUrlAction,
  markAllSocialPostsReadyAction,
  publishSocialPostNowAction,
  saveMetaConnectionManualAction,
  scheduleSocialPostAction,
  updateSocialPostCaptionAction,
  updateSocialPostImageAction,
  updateSocialPostOverlayAction,
  updateSocialPostScheduleAction,
  updateSocialPostStatusAction,
} from '@/app/admin/community/actions';
import {
  SOCIAL_LIBRARY_IMAGES,
  SOCIAL_NETWORK_LABELS,
  SOCIAL_STATUS_LABELS,
  localDayKey,
  startOfWeekMonday,
  type MetaSocialConnection,
  type SocialCommsBoard,
  type SocialNetwork,
  type SocialPost,
} from '@/lib/admin/social-comms';
import { ADMIN_FIELD_CLASS } from '@/components/Admin/adminSurfaceClasses';

const NETWORKS: SocialNetwork[] = ['instagram', 'whatsapp', 'facebook', 'tiktok'];

function toLocalInputValue(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInputValue(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildCopyText(post: SocialPost) {
  const hashtags = post.hashtags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)).join(' ');
  return [post.caption, post.cta, hashtags].filter(Boolean).join('\n\n');
}

async function downloadOverlayImage(post: SocialPost) {
  if (!post.imagePath) throw new Error('Aucune image');
  const img = new window.Image();
  img.crossOrigin = 'anonymous';
  const src = post.imagePath.startsWith('http') ? post.imagePath : post.imagePath;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Chargement image impossible'));
    img.src = src;
  });

  const canvas = document.createElement('canvas');
  const size = 1080;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponible');

  const scale = Math.max(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

  const gradient = ctx.createLinearGradient(0, size * 0.45, 0, size);
  gradient.addColorStop(0, 'rgba(30,24,20,0)');
  gradient.addColorStop(1, 'rgba(30,24,20,0.78)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const text = (post.useOverlay ? post.overlayText || post.title : post.title).trim();
  ctx.fillStyle = '#fffaf5';
  ctx.font = '600 54px Georgia, serif';
  ctx.textAlign = 'center';
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > size * 0.82) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const startY = size - 160 - (lines.length - 1) * 62;
  lines.slice(0, 3).forEach((item, index) => {
    ctx.fillText(item, size / 2, startY + index * 62);
  });

  ctx.fillStyle = '#C45D3E';
  ctx.font = '600 22px Inter, system-ui, sans-serif';
  ctx.fillText('FITMANGAS', size / 2, size - 56);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  if (!blob) throw new Error('Export image échoué');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitmangas-${post.id}.jpg`;
  a.click();
  URL.revokeObjectURL(url);
}

type Props = {
  board: SocialCommsBoard;
  meta: MetaSocialConnection;
  metaAppReady: boolean;
};

export function CommunityManagerBoard({ board, meta, metaAppReady }: Props) {
  const [networkFilter, setNetworkFilter] = useState<SocialNetwork | 'all'>('all');
  const [weekOffset, setWeekOffset] = useState(0);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [draftCaptions, setDraftCaptions] = useState<Record<string, string>>({});
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

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return date;
    });
  }, [weekStart]);

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

  function run(action: () => Promise<{ ok: boolean; error?: string; message?: string }>, successMessage: string) {
    setMessage('');
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setMessage(result.error || 'Action impossible.');
        return;
      }
      setMessage(result.message || successMessage);
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">Phase 1.5 + 2</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-luxury-ink md:text-3xl">Community Manager</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-luxury-muted">
              Calendrier, validation, texte sur image, et publication Meta (Instagram/Facebook). WhatsApp reste en
              copie manuelle.
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
                run(() => generateSocialWeekPlanAction(['instagram', 'whatsapp', 'facebook']), 'Plan de la semaine généré.')
              }
              className="btn-luxury-primary inline-flex min-h-[44px] items-center gap-2 px-5 text-xs disabled:opacity-60"
            >
              {pending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Générer la semaine
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <FilterChip active={networkFilter === 'all'} onClick={() => setNetworkFilter('all')} label={`Tous (${board.posts.length})`} />
          {NETWORKS.map((network) => (
            <FilterChip
              key={network}
              active={networkFilter === network}
              onClick={() => setNetworkFilter(network)}
              label={`${SOCIAL_NETWORK_LABELS[network]} (${counts[network]})`}
            />
          ))}
        </div>
        {message ? <p className="mt-4 text-sm text-luxury-muted">{message}</p> : null}
      </section>

      <section className="rounded-[2rem] border border-white/65 bg-white/70 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-[#C45D3E]" />
            <h2 className="text-lg font-semibold text-luxury-ink">Calendrier de la semaine</h2>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-luxury-ghost px-3 py-2 text-[11px]" onClick={() => setWeekOffset((v) => v - 1)}>
              ← Semaine
            </button>
            <button type="button" className="btn-luxury-ghost px-3 py-2 text-[11px]" onClick={() => setWeekOffset(0)}>
              Aujourd’hui
            </button>
            <button type="button" className="btn-luxury-ghost px-3 py-2 text-[11px]" onClick={() => setWeekOffset((v) => v + 1)}>
              Semaine →
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-7">
          {weekDays.map((day) => {
            const key = localDayKey(day);
            const dayPosts = posts.filter((post) => post.plannedAt && localDayKey(new Date(post.plannedAt)) === key);
            return (
              <div key={key} className="min-h-[140px] rounded-2xl border border-white/70 bg-white/60 p-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
                  {day.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}
                </p>
                <div className="mt-2 space-y-1.5">
                  {dayPosts.map((post) => (
                    <a
                      key={post.id}
                      href={`#post-${post.id}`}
                      className="block rounded-xl bg-[#fff4ee] px-2 py-1.5 text-[10px] font-semibold text-[#7a2e1a]"
                    >
                      {SOCIAL_NETWORK_LABELS[post.network]} · {post.title.slice(0, 28)}
                    </a>
                  ))}
                  {dayPosts.length === 0 ? <p className="text-[10px] text-luxury-muted">—</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/65 bg-white/70 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
        <h2 className="text-lg font-semibold text-luxury-ink">Connexion Meta (Instagram / Facebook)</h2>
        <p className="mt-1 text-sm text-luxury-muted">
          {meta.connected
            ? `Connecté : ${meta.pageName || meta.pageId}${meta.igUsername ? ` · @${meta.igUsername}` : ''}`
            : 'Non connecté. Colle un token Page, ou utilise OAuth si META_APP_ID est configuré.'}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            className={ADMIN_FIELD_CLASS}
            placeholder="Page ID"
            value={tokenForm.pageId}
            onChange={(e) => setTokenForm((s) => ({ ...s, pageId: e.target.value }))}
          />
          <input
            className={ADMIN_FIELD_CLASS}
            placeholder="Nom Page (optionnel)"
            value={tokenForm.pageName}
            onChange={(e) => setTokenForm((s) => ({ ...s, pageName: e.target.value }))}
          />
          <input
            className={ADMIN_FIELD_CLASS}
            placeholder="Instagram User ID"
            value={tokenForm.igUserId}
            onChange={(e) => setTokenForm((s) => ({ ...s, igUserId: e.target.value }))}
          />
          <input
            className={ADMIN_FIELD_CLASS}
            placeholder="Instagram @username"
            value={tokenForm.igUsername}
            onChange={(e) => setTokenForm((s) => ({ ...s, igUsername: e.target.value }))}
          />
          <input
            className={`${ADMIN_FIELD_CLASS} md:col-span-2`}
            placeholder="Page Access Token"
            value={tokenForm.accessToken}
            onChange={(e) => setTokenForm((s) => ({ ...s, accessToken: e.target.value }))}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            className="btn-luxury-primary px-4 py-2 text-[11px]"
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
                'Connexion Meta enregistrée.',
              )
            }
          >
            Enregistrer Meta
          </button>
          {metaAppReady ? (
            <button
              type="button"
              disabled={pending}
              className="btn-luxury-ghost px-4 py-2 text-[11px]"
              onClick={() =>
                run(async () => {
                  const res = await getMetaConnectUrlAction();
                  if (res.ok && 'url' in res && res.url) {
                    window.location.href = res.url;
                    return { ok: true };
                  }
                  return res;
                }, 'Redirection Meta…')
              }
            >
              Connecter via Facebook
            </button>
          ) : null}
          {meta.connected ? (
            <button
              type="button"
              disabled={pending}
              className="btn-luxury-ghost px-4 py-2 text-[11px]"
              onClick={() => run(() => disconnectMetaAction(), 'Meta déconnecté.')}
            >
              Déconnecter
            </button>
          ) : null}
        </div>
      </section>

      {whatsappDue.length > 0 ? (
        <section className="rounded-[2rem] border border-[#C45D3E]/35 bg-[#fff4ee] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
          <h2 className="text-lg font-semibold text-luxury-ink">WhatsApp — à envoyer maintenant</h2>
          <p className="mt-1 text-sm text-luxury-muted">
            API communauté limitée : copie le texte, envoie dans le groupe, puis marque « Publié (manuel) ».
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
                  {post.plannedAt ? (
                    <p className="mt-1 text-[11px] text-luxury-soft">
                      Prévu : {new Date(post.plannedAt).toLocaleString('fr-FR')}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void copyPost(post)}
                    className="btn-luxury-primary inline-flex min-h-[40px] items-center gap-2 px-4 text-[11px]"
                  >
                    {copiedId === post.id ? <Check size={14} /> : <Copy size={14} />}
                    {copiedId === post.id ? 'Copié' : 'Copier le message'}
                  </button>
                  <a href={`#post-${post.id}`} className="btn-luxury-ghost inline-flex min-h-[40px] items-center px-4 text-[11px]">
                    Voir
                  </a>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(() => updateSocialPostStatusAction(post.id, 'published'), 'WhatsApp marqué publié.')
                    }
                    className="btn-luxury-ghost min-h-[40px] px-4 text-[11px]"
                  >
                    Publié (manuel)
                  </button>
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
          posts.map((post) => {
            const caption = draftCaptions[post.id] ?? post.caption;
            return (
              <article
                id={`post-${post.id}`}
                key={post.id}
                className="overflow-hidden rounded-[1.75rem] border border-white/65 bg-white/70 shadow-[0_14px_34px_rgba(15,23,42,0.07)]"
              >
                <div className="grid gap-0 lg:grid-cols-[200px_minmax(0,1fr)]">
                  <div className="relative min-h-[200px] bg-brand-beige">
                    {post.imagePath ? (
                      <>
                        <Image src={post.imagePath} alt="" fill className="object-cover" sizes="200px" />
                        {post.useOverlay ? (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                            <p className="text-center font-serif text-sm italic text-white">{post.overlayText || post.title}</p>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="flex h-full min-h-[200px] items-center justify-center px-4 text-center text-xs text-luxury-muted">
                        Message texte (WhatsApp)
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
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-luxury-ink">{post.title}</h2>
                    {post.whyItWorks ? <p className="mt-1 text-xs leading-5 text-luxury-soft">{post.whyItWorks}</p> : null}

                    <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
                      Date / heure
                    </label>
                    <input
                      type="datetime-local"
                      className={`${ADMIN_FIELD_CLASS} max-w-xs`}
                      defaultValue={toLocalInputValue(post.plannedAt)}
                      onBlur={(e) => {
                        const next = fromLocalInputValue(e.target.value);
                        run(() => updateSocialPostScheduleAction(post.id, next), 'Date mise à jour.');
                      }}
                    />

                    {post.network !== 'whatsapp' ? (
                      <>
                        <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">
                          Image
                        </label>
                        <select
                          className={ADMIN_FIELD_CLASS}
                          value={post.imagePath || ''}
                          onChange={(e) =>
                            run(
                              () => updateSocialPostImageAction(post.id, e.target.value || null),
                              'Image mise à jour.',
                            )
                          }
                        >
                          {SOCIAL_LIBRARY_IMAGES.map((path) => (
                            <option key={path} value={path}>
                              {path.split('/').pop()}
                            </option>
                          ))}
                        </select>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <label className="inline-flex items-center gap-2 text-xs text-luxury-muted">
                            <input
                              type="checkbox"
                              checked={post.useOverlay}
                              onChange={(e) =>
                                run(
                                  () =>
                                    updateSocialPostOverlayAction(
                                      post.id,
                                      post.overlayText || post.title,
                                      e.target.checked,
                                    ),
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
                            onBlur={(e) =>
                              run(
                                () => updateSocialPostOverlayAction(post.id, e.target.value, post.useOverlay),
                                'Texte overlay enregistré.',
                              )
                            }
                          />
                          <button
                            type="button"
                            className="btn-luxury-ghost inline-flex min-h-[40px] items-center gap-2 px-3 text-[11px]"
                            onClick={() =>
                              void downloadOverlayImage(post).catch(() => setMessage('Export image impossible.'))
                            }
                          >
                            <Download size={14} />
                            Télécharger visuel
                          </button>
                        </div>
                      </>
                    ) : null}

                    <textarea
                      value={caption}
                      onChange={(e) => setDraftCaptions((current) => ({ ...current, [post.id]: e.target.value }))}
                      rows={5}
                      className="mt-4 w-full rounded-2xl border border-[#D9C9B4] bg-white px-4 py-3 text-sm text-luxury-ink outline-none focus:border-[#C45D3E]/60 focus:ring-2 focus:ring-[#C45D3E]/25"
                    />
                    {post.cta ? <p className="mt-2 text-xs font-medium text-[#7a2e1a]">CTA : {post.cta}</p> : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" disabled={pending} onClick={() => void copyPost(post)} className="btn-luxury-ghost min-h-[40px] gap-2 px-4 text-[11px]">
                        {copiedId === post.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === post.id ? 'Copié' : 'Copier'}
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
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(() => updateSocialPostStatusAction(post.id, 'ready'), 'Post marqué prêt.')}
                        className="btn-luxury-ghost min-h-[40px] px-4 text-[11px]"
                      >
                        Prêt
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(() => scheduleSocialPostAction(post.id), 'Post programmé.')}
                        className="btn-luxury-ghost min-h-[40px] px-4 text-[11px]"
                      >
                        Programmer
                      </button>
                      {(post.network === 'instagram' || post.network === 'facebook') && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => run(() => publishSocialPostNowAction(post.id), 'Publié sur Meta.')}
                          className="btn-luxury-primary inline-flex min-h-[40px] items-center gap-2 px-4 text-[11px]"
                        >
                          <Send size={14} />
                          Publier maintenant
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(() => updateSocialPostStatusAction(post.id, 'published'), 'Marqué publié (manuel).')}
                        className="btn-luxury-ghost min-h-[40px] px-4 text-[11px]"
                      >
                        Publié (manuel)
                      </button>
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
          })
        )}
      </section>
    </div>
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
