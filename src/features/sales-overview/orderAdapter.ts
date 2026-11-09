import type { Order } from '../../types/order';
import type { OverviewOrder } from './types';

/** Explicit allowlist: never pass customer information or current catalog prices. */
export function mapOverviewOrders(orders: readonly Order[]): OverviewOrder[] {
  const ids = new Set<string>();
  const keys = new Set<string>();
  return orders.filter(order => {
    if (order.mode !== 'SIMULATION') throw new Error('Die Übersicht unterstützt nur lokale Simulationen.');
    if (ids.has(order.id) || (order.idempotencyKey && keys.has(order.idempotencyKey))) {
      throw new Error('Doppelte Bestellkennungen im lokalen Speicher. Auswertung aus Sicherheitsgründen angehalten.');
    }
    ids.add(order.id);
    if (order.idempotencyKey) keys.add(order.idempotencyKey);
    return true;
  }).map(order => {
    if (!Number.isSafeInteger(order.pricing.finalTotalRappen) || order.pricing.finalTotalRappen < 0
      || !Number.isFinite(Date.parse(order.createdAt)) || !order.items.length
      || order.items.some(item => !Number.isSafeInteger(item.quantity) || item.quantity <= 0
        || !Number.isSafeInteger(item.unitPriceRappen) || item.unitPriceRappen < 0)) {
      throw new Error('Unvollständiger Bestell-Snapshot. Es werden keine aktuellen Katalogpreise nachgeladen.');
    }
    return {
      id: order.id, sellerId: order.sellerId, fairId: order.fairId, createdAt: order.createdAt,
      cancelled: order.status === 'cancelled', example: order.demoScenario === 'sales-overview-v1',
      totalRappen: order.pricing.finalTotalRappen,
      lines: order.items.map(item => ({ qty: item.quantity, unitPriceRappen: item.unitPriceRappen })),
    };
  });
}
