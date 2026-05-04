import type { NotificationCategory } from './types';

/** Maps event_type prefixes to preference buckets (prompt maître §8.2). */
export function categoryFromEventType(eventType: string): NotificationCategory {
  if (
    eventType.startsWith('subscription.') ||
    eventType.startsWith('account.') ||
    eventType.startsWith('payment.') ||
    eventType.startsWith('auth.security') ||
    eventType.startsWith('billing.')
  ) {
    return 'account';
  }
  if (
    eventType.startsWith('course.') ||
    eventType.startsWith('courses.') ||
    eventType.startsWith('live.') ||
    eventType.startsWith('planning.') ||
    eventType.startsWith('enrollment.')
  ) {
    return 'courses';
  }
  if (
    eventType.startsWith('blog.') ||
    eventType.startsWith('replay.') ||
    eventType.startsWith('content.') ||
    eventType.startsWith('standalone.')
  ) {
    return 'content';
  }
  if (eventType.startsWith('shop.') || eventType.startsWith('boutique.') || eventType.startsWith('printful.')) {
    return 'shop';
  }
  if (eventType.startsWith('community.')) {
    return 'community';
  }
  return 'courses';
}

/**
 * Critical events bypass silence_mode for client-facing channels.
 * Prefixes: subscription.payment_failed*, course.<slug>.cancelled
 */
export function isCriticalEventType(eventType: string): boolean {
  if (eventType.startsWith('subscription.payment_failed')) {
    return true;
  }
  if (/^course\.[^.]+\.cancelled/.test(eventType)) {
    return true;
  }
  return false;
}
