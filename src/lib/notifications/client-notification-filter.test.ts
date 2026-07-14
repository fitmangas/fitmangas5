import { describe, expect, it } from 'vitest';

import {
  isAdminOnlyNotificationKind,
  isClientVisibleNotificationKind,
} from './client-notification-filter';

describe('client-notification-filter', () => {
  it('masque les alertes admin de nouveaux tickets', () => {
    expect(isAdminOnlyNotificationKind('support_ticket')).toBe(true);
    expect(isAdminOnlyNotificationKind('admin_support_ticket')).toBe(true);
    expect(isClientVisibleNotificationKind('support_ticket')).toBe(false);
  });

  it('laisse passer les notifs clientes', () => {
    expect(isClientVisibleNotificationKind('blog_article')).toBe(true);
    expect(isClientVisibleNotificationKind('support_ticket_resolved')).toBe(true);
    expect(isClientVisibleNotificationKind('account.support_ticket_received')).toBe(true);
  });
});
