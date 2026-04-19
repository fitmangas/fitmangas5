import Link from 'next/link';

import { AvatarWithRibbon } from '@/components/ui/AvatarWithRibbon';
import { createClient } from '@/lib/supabase/server';

import { NotificationBell, type NotificationRow } from './NotificationBell';

export async function CompteTopBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, notifResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, gamification_grade, gamification_points')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('user_notifications')
      .select('id, kind, title, body, read_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(25),
  ]);

  const notifications = notifResult.error ? [] : (notifResult.data ?? []);

  const display =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Compte';
  const avatarUrl = profile?.avatar_url?.trim();
  const grade = (profile as { gamification_grade?: string | null })?.gamification_grade;
  const points = (profile as { gamification_points?: number | null })?.gamification_points;

  return (
    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 pb-10 pt-4 md:px-8">
      <Link href="/compte" className="flex min-w-0 items-start gap-3">
        <AvatarWithRibbon
          avatarUrl={avatarUrl}
          displayName={display}
          grade={grade}
          sizePx={48}
          showPoints
          points={points ?? 0}
        />
        <div className="min-w-0 pt-1">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.28em] text-brand-accent">Espace client</p>
          <p className="truncate font-serif text-lg italic text-brand-ink">{display}</p>
        </div>
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <NotificationBell items={(notifications ?? []) as NotificationRow[]} />
        <Link
          href="/compte/profil"
          className="rounded-full border border-brand-ink/[0.1] bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-ink/75 transition hover:border-brand-accent/30 hover:bg-brand-beige/40"
        >
          Mon profil
        </Link>
      </div>
    </div>
  );
}
