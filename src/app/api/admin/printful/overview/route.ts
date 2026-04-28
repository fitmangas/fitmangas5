import { NextResponse } from 'next/server';

import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import { getPrintfulOrders, getPrintfulProducts, parseMoney } from '@/lib/printful';

export async function GET() {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  try {
    const [products, orders] = await Promise.all([getPrintfulProducts(), getPrintfulOrders(80)]);
    const activeStatuses = new Set(['pending', 'draft', 'inprocess', 'onhold', 'fulfilled', 'partial']);
    const inProgress = orders.filter((o) => activeStatuses.has((o.status ?? '').toLowerCase()));

    const totals = orders.reduce(
      (acc, order) => {
        const revenue = parseMoney(order.retail_costs?.total);
        const cost = parseMoney(order.costs?.total);
        acc.revenue += revenue;
        acc.cost += cost;
        acc.gain += revenue - cost;
        return acc;
      },
      { revenue: 0, cost: 0, gain: 0 },
    );

    return NextResponse.json({
      productsCount: products.length,
      ordersCount: orders.length,
      inProgressCount: inProgress.length,
      totals,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
