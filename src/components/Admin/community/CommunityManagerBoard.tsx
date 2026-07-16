'use client';

import Image from 'next/image';
import { useMemo, useState, useTransition } from 'react';
import { Check, Copy, Loader2, Sparkles, Trash2 } from 'lucide-react';

import {
  deleteSocialPostAction,
  generateSocialWeekPlanAction,
  updateSocialPostCaptionAction,
  updateSocialPostStatusAction,
} from '@/app/admin/community/actions';
import {
  SOCIAL_NETWORK_LABELS,
  SOCIAL_STATUS_LABELS,
  type SocialCommsBoard,
  type SocialNetwork,
  type SocialPost,
} from '@/lib/admin/social-comms';

const NETWORKS: SocialNetwork[] = ['instagram', 'whatsapp', 'facebook', 'tiktok'];

function formatWhen(value: string | null) {
  if (!value) return 'Non daté';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Non daté';
  return date.toLocaleString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildCopyText(post: SocialPost) {
  const hashtags = post.hashtags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)).join(' ');
  return [post.caption, post.cta, hashtags].filter(Boolean).join('\n\n');
}

export function CommunityManagerBoard({ board }: { board: SocialCommsBoard }) {
  const [networkFilter, setNetworkFilter] = useState<SocialNetwork | 'all'>('all');
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [draftCaptions, setDraftCaptions] = useState<Record<string, string>>({});

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

  function run(action: () => Promise<{ ok: boolean; error?: string; created?: number }>, successMessage: string) {
    setMessage('');
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setMessage(result.error || 'Action impossible.');
        return;
      }
      setMessage(successMessage);
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">Phase 1</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-luxury-ink md:text-3xl">
              Community Manager
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-luxury-muted">
              Organise Instagram, WhatsApp communauté, Facebook et TikTok. Génère une semaine de posts, copie le
              texte, puis marque comme prêt ou publié. La publication automatique viendra en phase 2.
            </p>
            {board.lastGeneratedAt ? (
              <p className="mt-2 text-xs text-luxury-soft">
                Dernière génération IA : {new Date(board.lastGeneratedAt).toLocaleString('fr-FR')}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(
                () => generateSocialWeekPlanAction(['instagram', 'whatsapp', 'facebook']),
                'Plan de la semaine généré.',
              )
            }
            className="btn-luxury-primary inline-flex min-h-[44px] items-center justify-center gap-2 px-5 text-xs disabled:opacity-60"
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Générer la semaine
          </button>
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

      <section className="grid gap-4 md:grid-cols-3">
        <InsightCard
          title="Ce qui marche en général"
          body="Les posts utiles + concrets (1 conseil, 1 sensation, 1 CTA doux) convertissent mieux que les pubs trop commerciales."
        />
        <InsightCard
          title="Instagram"
          body="Alterne photo coach, capture espace cliente, et mini-conseil. Stories pour le rappel live, feed pour la confiance."
        />
        <InsightCard
          title="WhatsApp communauté"
          body="Messages courts, ton proche, un seul lien. Idéal pour rappeler un live ou partager un article utile."
        />
      </section>

      <section className="space-y-4">
        {posts.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-[#C45D3E]/25 bg-white/55 px-5 py-10 text-center text-sm text-luxury-muted">
            Aucun post pour l’instant. Clique sur « Générer la semaine » pour démarrer.
          </div>
        ) : (
          posts.map((post) => {
            const caption = draftCaptions[post.id] ?? post.caption;
            return (
              <article
                key={post.id}
                className="overflow-hidden rounded-[1.75rem] border border-white/65 bg-white/70 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-xl"
              >
                <div className="grid gap-0 lg:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="relative min-h-[160px] bg-brand-beige">
                    {post.imagePath ? (
                      <Image src={post.imagePath} alt="" fill className="object-cover" sizes="180px" />
                    ) : (
                      <div className="flex h-full min-h-[160px] items-center justify-center px-4 text-center text-xs text-luxury-muted">
                        {post.imageHint || 'Sans image'}
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
                      <span className="text-xs text-luxury-muted">{formatWhen(post.plannedAt)}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-luxury-ink">{post.title}</h2>
                    {post.whyItWorks ? <p className="mt-1 text-xs leading-5 text-luxury-soft">{post.whyItWorks}</p> : null}
                    <textarea
                      value={caption}
                      onChange={(event) =>
                        setDraftCaptions((current) => ({ ...current, [post.id]: event.target.value }))
                      }
                      rows={5}
                      className="mt-4 w-full rounded-2xl border border-[#D9C9B4] bg-white px-4 py-3 text-sm text-luxury-ink shadow-[inset_0_1px_3px_rgba(31,27,22,0.08)] outline-none focus:border-[#C45D3E]/60 focus:ring-2 focus:ring-[#C45D3E]/25"
                    />
                    {post.cta ? <p className="mt-2 text-xs font-medium text-[#7a2e1a]">CTA : {post.cta}</p> : null}
                    {post.sourceRef ? (
                      <a
                        href={post.sourceRef}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-luxury-muted underline underline-offset-2"
                      >
                        Source
                      </a>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => void copyPost(post)}
                        className="btn-luxury-ghost min-h-[40px] gap-2 px-4 text-[11px]"
                      >
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
                      <StatusButton
                        disabled={pending}
                        label="Prêt"
                        onClick={() =>
                          run(() => updateSocialPostStatusAction(post.id, 'ready'), 'Post marqué prêt.')
                        }
                      />
                      <StatusButton
                        disabled={pending}
                        label="Publié"
                        onClick={() =>
                          run(() => updateSocialPostStatusAction(post.id, 'published'), 'Post marqué publié.')
                        }
                      />
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

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/65 bg-white/60 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">{title}</p>
      <p className="mt-2 text-sm leading-6 text-luxury-muted">{body}</p>
    </div>
  );
}

function StatusButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="btn-luxury-ghost min-h-[40px] px-4 text-[11px] disabled:opacity-60"
    >
      {label}
    </button>
  );
}
