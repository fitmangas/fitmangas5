'use client';

import { useEffect, useRef } from 'react';

type Props = { articleId: string; readTimeMs?: number };

export function BlogScrollTracker({ articleId, readTimeMs = 30_000 }: Props) {
  const start = useRef(Date.now());
  const lastSend = useRef(0);
  const maxScroll = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const h = el.scrollHeight - el.clientHeight;
      if (h <= 0) return;
      const pct = Math.min(100, Math.round((el.scrollTop / h) * 100));
      if (pct > maxScroll.current) maxScroll.current = pct;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      if (now - lastSend.current < readTimeMs) return;
      lastSend.current = now;
      const timeSpent = Math.round((now - start.current) / 1000);
      const w = typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop';
      void fetch(`/api/client/blog/articles/id/${articleId}/scroll-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scrollPercentage: maxScroll.current,
          timeSpentSeconds: timeSpent,
          deviceType: w,
          trafficSource: 'direct',
        }),
      }).catch(() => {});
    }, readTimeMs);
    return () => clearInterval(id);
  }, [articleId, readTimeMs]);

  return null;
}
