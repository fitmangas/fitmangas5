import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { loadNotificationObservability } from '@/lib/admin/notification-observability';

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') === 'all' ? 'all' : 'month';
  const summary = await loadNotificationObservability(period);
  return NextResponse.json(summary);
}
