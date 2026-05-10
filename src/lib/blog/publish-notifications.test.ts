import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(async () => ({ ok: true, notification_log_ids: ['1'] })),
}));

vi.mock('@/lib/notifications/dispatcher', () => ({
  dispatch: mocks.dispatch,
}));

import { notifyMembersNewBlogArticle } from './publish-notifications';

function blogClient() {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          range: vi.fn(async () => ({ data: [{ id: 'u1' }], error: null })),
        })),
      })),
    })),
  };
}

describe('notifyMembersNewBlogArticle', () => {
  it('article publié → dispatch via dispatcher', async () => {
    const client = blogClient();
    await notifyMembersNewBlogArticle(client as never, { articleId: 'a1', title: 'Pilates', slugFr: 'pilates' });
    expect(mocks.dispatch).toHaveBeenCalledWith(client, expect.objectContaining({ event_type: 'blog.article_published' }));
  });
});
