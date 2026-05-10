'use server';

import { createClient } from '@/lib/supabase/server';

export async function updateDetectedTimezoneOnLogin(timeZone: string) {
  const normalized = timeZone.trim();
  if (!normalized) {
    return { updated: false as const, reason: 'empty' as const };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { updated: false as const, reason: 'unauthenticated' as const };
  }

  const { data: profile, error: readError } = await supabase
    .from('profiles')
    .select('display_timezone_manual_locked, display_timezone')
    .eq('id', user.id)
    .single();

  if (readError || !profile) {
    return { updated: false as const, reason: 'profile_read_error' as const };
  }

  if (profile.display_timezone_manual_locked) {
    return { updated: false as const, reason: 'manual_locked' as const };
  }

  if (profile.display_timezone === normalized) {
    return { updated: false as const, reason: 'unchanged' as const };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ display_timezone: normalized })
    .eq('id', user.id)
    .eq('display_timezone_manual_locked', false);

  if (error) {
    return { updated: false as const, reason: 'profile_update_error' as const };
  }

  return { updated: true as const };
}
