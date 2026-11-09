import type { Metric, OverviewOrder, OverviewSeller, OverviewStats, Period, SellerStats } from './types';

export const orderBottles = (o: OverviewOrder) => o.lines.reduce((a, l) => a + l.qty, 0);
export const orderRappen = (o: OverviewOrder) => o.totalRappen ?? o.lines.reduce((a, l) => a + l.qty * l.unitPriceRappen, 0);

/** CHF mit Schweizer Tausendertrennung, nur ganzzahlige Rappen. Beispiel: 123450 → "CHF 1’234.50" */
export function formatChf(rappen: number): string {
  const a = Math.abs(Math.round(rappen));
  return `${rappen < 0 ? '−' : ''}CHF ${String(Math.floor(a / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '’')}.${String(a % 100).padStart(2, '0')}`;
}

/** Swiss calendar boundaries, independent of the device timezone, including DST. */
const swissClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
function swissParts(date: Date) {
  const parts = Object.fromEntries(swissClock.formatToParts(date).map(p => [p.type, p.value]));
  return { year: +parts.year, month: +parts.month, day: +parts.day,
    hour: +parts.hour, minute: +parts.minute, second: +parts.second };
}
export function periodStart(period: Period, now: Date): Date | null {
  if (period === 'fair') return null;
  const p = swissParts(now);
  const day = new Date(Date.UTC(p.year, p.month - 1, period === 'month' ? 1 : p.day));
  if (period === 'week') day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  const target = day.getTime();
  let instant = target;
  // Solve Swiss midnight. The second pass accounts for a DST boundary on that date.
  for (let i = 0; i < 3; i++) {
    const q = swissParts(new Date(instant));
    const wall = Date.UTC(q.year, q.month - 1, q.day, q.hour, q.minute, q.second);
    instant += target - wall;
  }
  return new Date(instant);
}

/** Filter: Messe (`all` = alle Messen), Zeitraum (nur Untergrenze), stornierte ausgeschlossen. */
export function filterOrders(orders: OverviewOrder[], o: { fairId: string | 'all'; period: Period; now: Date }): OverviewOrder[] {
  const from = periodStart(o.period, o.now)?.getTime() ?? -Infinity;
  return orders.filter((x) => {
    if (x.cancelled) return false;
    if (o.fairId !== 'all' && x.fairId !== o.fairId) return false;
    const t = new Date(x.createdAt).getTime();
    return Number.isFinite(t) && t >= from && t <= o.now.getTime();
  });
}

/** Alle Kennzahlen werden aus den Bestellungen berechnet. Verkäufer ohne Bestellung erscheinen mit 0. */
export function computeOverview(orders: OverviewOrder[], sellers: OverviewSeller[]): OverviewStats {
  const rows: SellerStats[] = sellers.map((s) => {
    const list = orders.filter((o) => o.sellerId === s.id);
    return { sellerId: s.id, name: s.name, orders: list.length, bottles: list.reduce((a, o) => a + orderBottles(o), 0), revenueRappen: list.reduce((a, o) => a + orderRappen(o), 0), orderList: list };
  });
  const byRevenue = rows.map((r, i) => ({ r, i })).sort((a, b) => b.r.revenueRappen - a.r.revenueRappen || a.i - b.i).map((x) => x.r);
  return {
    orders: orders.length,
    bottles: orders.reduce((a, o) => a + orderBottles(o), 0),
    revenueRappen: orders.reduce((a, o) => a + orderRappen(o), 0),
    sellersWithOrders: rows.filter((r) => r.orders > 0).length,
    sellerCount: sellers.length,
    sellers: byRevenue,
  };
}

export const metricValue = (r: SellerStats, m: Metric) => (m === 'revenue' ? r.revenueRappen : m === 'orders' ? r.orders : r.bottles);
