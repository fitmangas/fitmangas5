import Link from 'next/link';

import { AvatarWithRibbon } from '@/components/ui/AvatarWithRibbon';
import { GlassCard } from '@/components/ui/GlassCard';
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
    <div className="mx-auto mb-8 mt-4 grid max-w-5xl gap-8 px-4 md:grid-cols-2 md:px-8">
      <GlassCard className="px-5 py-4 md:px-6">
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
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">Espace client</p>
            <p className="truncate text-lg font-semibold tracking-tight text-luxury-ink">{display}</p>
          </div>
        </Link>
      </GlassCard>

      <GlassCard className="flex flex-wrap items-center justify-end gap-3 px-5 py-4 md:px-6">
        <NotificationBell items={(notifications ?? []) as NotificationRow[]} />
        <Link href="/compte/profil" className="btn-luxury-ghost px-5 py-2.5 text-[10px] tracking-[0.14em]">
          Mon profil
        </Link>
      </GlassCard>
    </div>
  );
}
