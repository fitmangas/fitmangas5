import { describe, expect, it } from 'vitest';

import {
  filterEmailsForBlogPublicSend,
  resolveEmailFlowPriority,
} from './email-flow-priority';

describe('resolveEmailFlowPriority', () => {
  it('membre active gagne sur acquisition et blog', () => {
    expect(
      resolveEmailFlowPriority({
        email: 'a@b.com',
        subscriptionStatus: 'active',
        hasAcquisitionOptIn: true,
        hasBlogPublic: true,
      }),
    ).toBe('member');
  });

  it('trialing = membre', () => {
    expect(
      resolveEmailFlowPriority({
        email: 'a@b.com',
        subscriptionStatus: 'trialing',
        hasAcquisitionOptIn: true,
      }),
    ).toBe('member');
  });

  it('acquisition avant blog public', () => {
    expect(
      resolveEmailFlowPriority({
        email: 'a@b.com',
        hasAcquisitionOptIn: true,
        hasBlogPublic: true,
      }),
    ).toBe('acquisition');
  });

  it('blog public si seul flux', () => {
    expect(
      resolveEmailFlowPriority({
        email: 'a@b.com',
        hasBlogPublic: true,
      }),
    ).toBe('blog_public');
  });

  it('filterEmailsForBlogPublicSend exclut les membres', () => {
    const members = new Set(['member@fitmangas.com']);
    expect(
      filterEmailsForBlogPublicSend(
        ['member@fitmangas.com', 'prospect@fitmangas.com'],
        members,
      ),
    ).toEqual(['prospect@fitmangas.com']);
  });
});
