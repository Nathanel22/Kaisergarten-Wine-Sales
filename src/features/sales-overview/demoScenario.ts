import { periodStart } from './salesStats';
import { CATALOG } from '../../data/catalog';
import { INITIAL_DEMO_CUSTOMERS } from '../../data/mockCustomers';
import { DEMO_SELLERS } from '../../config/demoSeller';
import { getDemoFairContext } from '../../config/fairContext';
import { isOrderableWine } from '../../utils/catalog';
import { buildOrder, loadStoredOrders } from '../../utils/orderProcessing';
import { ORDERS_STORAGE_KEY } from '../../utils/demoStorage';
import type { Order } from '../../types/order';

export const SCENARIO_SEEN_KEY = 'kaisergarten_demo_scenario_seen_v1';
export const SCENARIO_ID = 'sales-overview-v1' as const;
// Claude's scenario: product index and bottle quantity, never fixed revenue totals.
const SCENARIO: { seller: number; lines: [number, number][] }[] = [
  { seller: 0, lines: [[0, 12]] }, { seller: 0, lines: [[1, 6], [2, 6]] },
  { seller: 1, lines: [[2, 6]] }, { seller: 3, lines: [[0, 6]] },
  { seller: 3, lines: [[1, 6]] }, { seller: 3, lines: [[2, 6]] },
];

export function buildDemoScenario(now = new Date()): Order[] {
  const products = CATALOG.filter(isOrderableWine).filter(p => p.priceSource === 'DEMO-PREIS').slice(0, 3);
  const fairContext = getDemoFairContext();
  if (products.length !== 3 || DEMO_SELLERS.length !== 4 || !fairContext) {
    throw new Error('Beispielszenario benötigt drei Demo-Preis-Artikel, vier Verkäufer und eine aktive Messe.');
  }
  const midnight = periodStart('today', now)!.getTime();
  return SCENARIO.map((entry, i) => {
    const id = `DEMO-SZENARIO-${i + 1}`;
    const date = new Date(Math.max(midnight, now.getTime() - (SCENARIO.length - i) * 7 * 60000));
    return {
      ...buildOrder({
        items: entry.lines.map(([index, quantity]) => ({ wine: products[index], quantity })),
        customer: INITIAL_DEMO_CUSTOMERS[0], seller: DEMO_SELLERS[entry.seller], fairContext,
        idempotencyKey: `${SCENARIO_ID}-${i + 1}`,
        notes: 'Synthetisches Demo-Beispielszenario – keine echte Bestellung.',
      }, id, date),
      demoScenario: SCENARIO_ID,
    };
  });
}

/** One atomic write to the EXISTING order store; no second order database or partial six-order seed. */
function replaceScenarioOrders(before: Order[], after: Order[]): Order[] {
  if (JSON.stringify(loadStoredOrders(true)) !== JSON.stringify(before)) {
    throw new Error('Der Bestellspeicher wurde zwischenzeitlich geändert. Bitte neu laden.');
  }
  const json = JSON.stringify(after);
  localStorage.setItem(ORDERS_STORAGE_KEY, json);
  if (localStorage.getItem(ORDERS_STORAGE_KEY) !== json) throw new Error('Speicherung des Beispielszenarios nicht bestätigt.');
  return loadStoredOrders(true);
}

export function initializeDemoScenario(now = new Date()): Order[] {
  const current = loadStoredOrders(true);
  // Existing orders (including a prior seed) are never replaced or appended to.
  if (current.length) return current;
  return replaceScenarioOrders(current, buildDemoScenario(now));
}

export function removeDemoScenario(): Order[] {
  const current = loadStoredOrders(true);
  rememberScenario();
  const remaining = current.filter(order => order.demoScenario !== SCENARIO_ID);
  if (remaining.length === current.length) return current;
  return replaceScenarioOrders(current, remaining);
}

/** Lifecycle marker only, not an order store. Intentionally survives the global demo reset. */
function rememberScenario() {
  localStorage.setItem(SCENARIO_SEEN_KEY, 'seen');
  if (localStorage.getItem(SCENARIO_SEEN_KEY) !== 'seen') throw new Error('Beispielstatus konnte nicht gespeichert werden.');
}
export function initializeDemoScenarioOnce(now = new Date()): Order[] {
  const current = loadStoredOrders(true);
  if (localStorage.getItem(SCENARIO_SEEN_KEY) !== null) return current;
  const orders = current.length ? current : initializeDemoScenario(now);
  rememberScenario();
  return orders;
}
