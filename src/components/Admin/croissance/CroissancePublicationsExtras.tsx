'use client';

import { useTransition } from 'react';

import {
  publishSocialPostNowAction,
  updateSocialPostStatusAction,
} from '@/app/admin/community/actions';
import { A_VALIDER_LOT7 } from '@/content/a-valider';
import { findDuplicateCaption } from '@/lib/admin/caption-duplicate';
import type { SocialPost } from '@/lib/admin/social-comms';

type Props = { posts: SocialPost[] };

function isStuckPublishing(post: SocialPost): boolean {
  if (post.status !== 'publishing') return false;
  const updated = Date.parse(post.updatedAt || post.plannedAt || '');
  if (!Number.isFinite(updated)) return true;
  return Date.now() - updated > 30 * 60 * 1000;
}

export function CroissancePublicationsExtras({ posts }: Props) {
  const [pending, start] = useTransition();
  const toFilm = posts.filter(
    (p) => p.format === 'reel' && !p.rawVideoPath && !p.editedVideoPath && p.status !== 'published',
  );
  const stuck = posts.filter(isStuckPublishing);
  const duplicate = posts
    .filter((p) => p.status === 'scheduled' || p.status === 'ready')
    .map((p) => ({
      post: p,
      hit: findDuplicateCaption(
        p.caption,
        posts.filter((o) => o.id !== p.id),
      ),
    }))
    .filter((x) => x.hit);

  return (
    <div className="mb-6 space-y-4 rounded-[1.75rem] border border-[#E8DFD4] bg-white/90 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C45D3E]">Publications · lot 7</p>
      <div>
        <h3 className="text-sm font-semibold text-[#2A2420]">{A_VALIDER_LOT7.toFilm.fr}</h3>
        {toFilm.length ? (
          <ul className="mt-2 space-y-1 text-sm text-[#5A5550]">
            {toFilm.slice(0, 8).map((p) => (
              <li key={p.id}>
                {p.title || 'Reel'} — tournage suggéré :{' '}
                {p.plannedAt
                  ? new Date(p.plannedAt).toLocaleDateString('fr-FR', { weekday: 'long' })
                  : 'prochain créneau libre'}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-[#78716C]">Aucun Reel sans MP4 pour l’instant.</p>
        )}
      </div>
      {stuck.length ? (
        <div>
          <h3 className="text-sm font-semibold text-[#2A2420]">Posts bloqués « en cours »</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {stuck.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-2">
                <span>
                  {p.title} — {A_VALIDER_LOT7.stuckSince.fr}{' '}
                  {new Date(p.updatedAt || p.plannedAt || Date.now()).toLocaleString('fr-FR')}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-full bg-[#C45D3E] px-3 py-1 text-xs font-semibold text-white"
                  onClick={() =>
                    start(() => {
                      void publishSocialPostNowAction(p.id);
                    })
                  }
                >
                  {A_VALIDER_LOT7.retryPublish.fr}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-full bg-[#F3EDE6] px-3 py-1 text-xs font-semibold"
                  onClick={() =>
                    start(() => {
                      void updateSocialPostStatusAction(p.id, 'idea');
                    })
                  }
                >
                  {A_VALIDER_LOT7.backToDraft.fr}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {duplicate.length ? (
        <div>
          <h3 className="text-sm font-semibold text-[#2A2420]">Alertes de doublon</h3>
          <ul className="mt-2 space-y-1 text-sm text-[#5A5550]">
            {duplicate.slice(0, 5).map(({ post, hit }) => (
              <li key={post.id}>
                {A_VALIDER_LOT7.duplicateCaption.fr} ({Math.round((hit?.score ?? 0) * 100)} % · {hit?.post.title})
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="text-xs text-[#78716C]">{A_VALIDER_LOT7.unsourced160.fr}</p>
      <details className="text-xs text-[#78716C]">
        <summary className="cursor-pointer font-semibold">?</summary>
        <p className="mt-1">
          Jargon technique (cover_url, POST /{'{ig-user-id}'}/media) : miniature Instagram, pas un bouton à copier.
        </p>
      </details>
    </div>
  );
}
