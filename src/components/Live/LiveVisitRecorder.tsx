'use client';

import { useEffect, useRef } from 'react';

import { createClient } from '@/lib/supabase/client';

/** Compte une participation live (1× par jour civil / cours) pour la gamification & l’activité ligne. */
export function LiveVisitRecorder({ courseId }: { courseId: string }) {
  const done = useRef(false);

  useEffect(() => {
    if (!courseId || done.current) return;
    done.current = true;
    void createClient().rpc('record_live_course_visit', { p_course_id: courseId });
  }, [courseId]);

  return null;
}
