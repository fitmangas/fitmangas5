'use client';

import { useEffect, useRef } from 'react';

export function BlogViewBeacon({ articleId }: { articleId: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void fetch(`/api/client/blog/articles/id/${articleId}/view`, { method: 'POST' }).catch(() => {});
  }, [articleId]);
  return null;
}
