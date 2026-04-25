import './load-env-local';

import { createClient } from '@supabase/supabase-js';

type ArticleStatus = 'draft' | 'validated' | 'published' | 'archived';

type Article = {
  id: string;
  title_fr: string;
  status: ArticleStatus;
  description_fr: string | null;
  content_fr: string | null;
  featured_image_url: string | null;
  scheduled_publication_at: string;
  created_at: string;
};

type ValidationRow = {
  id: string;
  article_id: string;
  coach_id: string;
  month_year: string;
  status: 'pending' | 'validated' | 'rejected';
  validated_at: string | null;
  notes: string | null;
};

type RatingRow = {
  id: string;
  user_id: string;
  article_id: string;
  rating: number;
  comment: string | null;
  rated_at: string;
};

type HeatmapRow = {
  id: string;
  article_id: string;
  section_bucket: number;
  scroll_hits: number;
  average_time_spent_seconds: number;
};

const APPLY = process.argv.includes('--apply');

function isWeakDraftContent(content: string | null, description: string | null): boolean {
  const c = (content ?? '').trim();
  const d = (description ?? '').trim();
  if (!c) return true;
  if (c.includes('Paragraphe intro article') || c.includes('Paragraphe développement')) return true;
  if (!c.includes('<h2') && c.length < 600) return true;
  if (d.includes('Description courte pour l’article')) return true;
  return false;
}

function statusWeight(status: ArticleStatus): number {
  if (status === 'published') return 400;
  if (status === 'validated') return 250;
  if (status === 'draft') return 120;
  return 10;
}

function articleScore(a: Article): number {
  const contentLen = (a.content_fr ?? '').length;
  const descLen = (a.description_fr ?? '').length;
  const weakPenalty = isWeakDraftContent(a.content_fr, a.description_fr) ? -200 : 150;
  const imgBonus = a.featured_image_url ? 80 : 0;
  const lenBonus = Math.min(120, Math.floor(contentLen / 60)) + Math.min(30, Math.floor(descLen / 30));
  return statusWeight(a.status) + weakPenalty + imgBonus + lenBonus;
}

function pickWinner(group: Article[]): Article {
  const published = group.filter((a) => a.status === 'published');
  if (published.length > 0) {
    return [...published].sort((a, b) => articleScore(b) - articleScore(a))[0];
  }
  const validated = group.filter((a) => a.status === 'validated');
  if (validated.length > 0) {
    return [...validated].sort((a, b) => articleScore(b) - articleScore(a))[0];
  }
  return [...group].sort((a, b) => articleScore(b) - articleScore(a))[0];
}

function bestValidationStatus(a: ValidationRow['status'], b: ValidationRow['status']): ValidationRow['status'] {
  const rank = { validated: 3, pending: 2, rejected: 1 } as const;
  return rank[a] >= rank[b] ? a : b;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.');
    process.exit(1);
  }

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: articles, error } = await admin
    .from('blog_articles')
    .select(
      'id,title_fr,status,description_fr,content_fr,featured_image_url,scheduled_publication_at,created_at',
    )
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[blog_articles]', error.message);
    process.exit(1);
  }

  const byTitle = new Map<string, Article[]>();
  for (const row of (articles ?? []) as Article[]) {
    const t = row.title_fr?.trim();
    if (!t) continue;
    const list = byTitle.get(t) ?? [];
    list.push(row);
    byTitle.set(t, list);
  }

  const duplicateGroups = Array.from(byTitle.entries()).filter(([, list]) => list.length > 1);
  if (duplicateGroups.length === 0) {
    console.log('Aucun doublon détecté (par title_fr).');
    return;
  }

  let mergedArticles = 0;
  let deletedArticles = 0;
  let movedValidations = 0;
  let movedRatings = 0;
  let movedScrollEvents = 0;
  let mergedHeatmapRows = 0;
  let movedTranslations = 0;
  let movedNewsletterRefs = 0;

  console.log(`Groupes doublons détectés: ${duplicateGroups.length}`);
  console.log(APPLY ? 'Mode APPLY: modifications en base.' : 'Mode DRY-RUN: aucune écriture.');

  for (const [title, group] of duplicateGroups) {
    const winner = pickWinner(group);
    const losers = group.filter((a) => a.id !== winner.id).sort((a, b) => articleScore(b) - articleScore(a));

    console.log(`\n[TITLE] ${title}`);
    console.log(`  keeper: ${winner.id} (score=${articleScore(winner)}, status=${winner.status})`);
    for (const l of losers) {
      console.log(`  loser : ${l.id} (score=${articleScore(l)}, status=${l.status})`);
    }

    for (const loser of losers) {
      mergedArticles += 1;

      // 1) validations -> merge by month_year
      const { data: loserVals } = await admin
        .from('admin_article_validations')
        .select('id,article_id,coach_id,month_year,status,validated_at,notes')
        .eq('article_id', loser.id);
      for (const val of (loserVals ?? []) as ValidationRow[]) {
        const { data: existing } = await admin
          .from('admin_article_validations')
          .select('id,article_id,coach_id,month_year,status,validated_at,notes')
          .eq('article_id', winner.id)
          .eq('month_year', val.month_year)
          .maybeSingle();

        if (!APPLY) {
          movedValidations += 1;
          continue;
        }

        if (!existing) {
          const { error: insertErr } = await admin.from('admin_article_validations').insert({
            article_id: winner.id,
            coach_id: val.coach_id,
            month_year: val.month_year,
            status: val.status,
            validated_at: val.validated_at,
            notes: val.notes,
          });
          if (insertErr) console.error('[validation insert]', insertErr.message);
          else movedValidations += 1;
        } else {
          const status = bestValidationStatus(existing.status, val.status);
          const validatedAt = existing.validated_at ?? val.validated_at;
          const notes = [existing.notes, val.notes].filter(Boolean).join('\n\n').trim() || null;
          const { error: updErr } = await admin
            .from('admin_article_validations')
            .update({ status, validated_at: validatedAt, notes })
            .eq('id', existing.id);
          if (updErr) console.error('[validation update]', updErr.message);
          else movedValidations += 1;
        }
      }
      if (APPLY) {
        await admin.from('admin_article_validations').delete().eq('article_id', loser.id);
      }

      // 2) ratings -> move by user conflict resolution
      const { data: loserRatings } = await admin
        .from('blog_article_ratings')
        .select('id,user_id,article_id,rating,comment,rated_at')
        .eq('article_id', loser.id);
      for (const rating of (loserRatings ?? []) as RatingRow[]) {
        const { data: winnerRating } = await admin
          .from('blog_article_ratings')
          .select('id,user_id,article_id,rating,comment,rated_at')
          .eq('article_id', winner.id)
          .eq('user_id', rating.user_id)
          .maybeSingle();

        if (!APPLY) {
          movedRatings += 1;
          continue;
        }

        if (!winnerRating) {
          const { error: moveErr } = await admin.from('blog_article_ratings').update({ article_id: winner.id }).eq('id', rating.id);
          if (moveErr) console.error('[rating move]', moveErr.message);
          else movedRatings += 1;
        } else {
          const takeLoser = new Date(rating.rated_at).getTime() > new Date(winnerRating.rated_at).getTime();
          if (takeLoser) {
            const { error: updErr } = await admin
              .from('blog_article_ratings')
              .update({ rating: rating.rating, comment: rating.comment, rated_at: rating.rated_at })
              .eq('id', winnerRating.id);
            if (updErr) console.error('[rating merge update]', updErr.message);
          }
          await admin.from('blog_article_ratings').delete().eq('id', rating.id);
          movedRatings += 1;
        }
      }

      // 3) scroll tracking -> direct move
      if (!APPLY) {
        const { count } = await admin
          .from('blog_scroll_tracking')
          .select('id', { count: 'exact', head: true })
          .eq('article_id', loser.id);
        movedScrollEvents += count ?? 0;
      } else {
        const { error: scrollErr } = await admin.from('blog_scroll_tracking').update({ article_id: winner.id }).eq('article_id', loser.id);
        if (scrollErr) console.error('[scroll move]', scrollErr.message);
        const { count } = await admin
          .from('blog_scroll_tracking')
          .select('id', { count: 'exact', head: true })
          .eq('article_id', winner.id);
        movedScrollEvents += count ?? 0;
      }

      // 4) heatmap -> merge by section_bucket
      const { data: loserHeat } = await admin
        .from('blog_heatmap_data')
        .select('id,article_id,section_bucket,scroll_hits,average_time_spent_seconds')
        .eq('article_id', loser.id);
      for (const h of (loserHeat ?? []) as HeatmapRow[]) {
        const { data: existing } = await admin
          .from('blog_heatmap_data')
          .select('id,article_id,section_bucket,scroll_hits,average_time_spent_seconds')
          .eq('article_id', winner.id)
          .eq('section_bucket', h.section_bucket)
          .maybeSingle();

        if (!APPLY) {
          mergedHeatmapRows += 1;
          continue;
        }

        if (!existing) {
          const { error: updErr } = await admin.from('blog_heatmap_data').update({ article_id: winner.id }).eq('id', h.id);
          if (updErr) console.error('[heatmap move]', updErr.message);
          else mergedHeatmapRows += 1;
        } else {
          const mergedHits = (existing.scroll_hits ?? 0) + (h.scroll_hits ?? 0);
          const mergedTime = Math.round(
            ((existing.average_time_spent_seconds ?? 0) + (h.average_time_spent_seconds ?? 0)) / 2,
          );
          const { error: mergeErr } = await admin
            .from('blog_heatmap_data')
            .update({ scroll_hits: mergedHits, average_time_spent_seconds: mergedTime })
            .eq('id', existing.id);
          if (mergeErr) console.error('[heatmap merge]', mergeErr.message);
          await admin.from('blog_heatmap_data').delete().eq('id', h.id);
          mergedHeatmapRows += 1;
        }
      }

      // 5) translations -> keep winner language row if exists
      const { data: loserTrans } = await admin
        .from('blog_article_translations')
        .select('id,language,title,description,content,meta_description,slug,auto_translated')
        .eq('article_id', loser.id);
      for (const tr of loserTrans ?? []) {
        const { data: winnerTr } = await admin
          .from('blog_article_translations')
          .select('id')
          .eq('article_id', winner.id)
          .eq('language', tr.language)
          .maybeSingle();
        if (!APPLY) {
          movedTranslations += 1;
          continue;
        }
        if (!winnerTr) {
          const { error: insErr } = await admin.from('blog_article_translations').insert({
            article_id: winner.id,
            language: tr.language,
            title: tr.title,
            description: tr.description,
            content: tr.content,
            meta_description: tr.meta_description,
            slug: tr.slug,
            auto_translated: tr.auto_translated,
          });
          if (insErr) console.error('[translation insert]', insErr.message);
          else movedTranslations += 1;
        }
      }
      if (APPLY) {
        await admin.from('blog_article_translations').delete().eq('article_id', loser.id);
      }

      // 6) newsletter refs -> move reference
      if (!APPLY) {
        const { count } = await admin
          .from('newsletter_subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('subscribed_from_article_id', loser.id);
        movedNewsletterRefs += count ?? 0;
      } else {
        const { error: nlErr } = await admin
          .from('newsletter_subscriptions')
          .update({ subscribed_from_article_id: winner.id })
          .eq('subscribed_from_article_id', loser.id);
        if (nlErr) console.error('[newsletter ref move]', nlErr.message);
      }

      // 7) delete loser article (remaining on delete cascade)
      if (APPLY) {
        const { error: delErr } = await admin.from('blog_articles').delete().eq('id', loser.id);
        if (delErr) {
          console.error(`[delete loser ${loser.id}]`, delErr.message);
        } else {
          deletedArticles += 1;
        }
      } else {
        deletedArticles += 1;
      }
    }
  }

  console.log('\n=== Résumé cleanup doublons blog ===');
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Articles fusionnés (losers traités): ${mergedArticles}`);
  console.log(`Articles doublons supprimés: ${deletedArticles}`);
  console.log(`Validations déplacées/merge: ${movedValidations}`);
  console.log(`Ratings déplacés/merge: ${movedRatings}`);
  console.log(`Scroll events déplacés (approx): ${movedScrollEvents}`);
  console.log(`Heatmap rows merge: ${mergedHeatmapRows}`);
  console.log(`Traductions déplacées: ${movedTranslations}`);
  console.log(`Refs newsletter déplacées (approx): ${movedNewsletterRefs}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
