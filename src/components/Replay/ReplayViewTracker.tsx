'use client';

import { useEffect, useRef } from 'react';

import { createClient } from '@/lib/supabase/client';

/** Compte une vue replay (une fois au montage). */
export function ReplayViewTracker({ recordingId }: { recordingId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (!recordingId || fired.current) return;
    fired.current = true;
    void createClient().rpc('increment_replay_view', { p_recording_id: recordingId });
  }, [recordingId]);

  return null;
}
