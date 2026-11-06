import { CATALOG } from '../data/catalog';
import { INITIAL_DEMO_CUSTOMERS } from '../data/mockCustomers';
import { DEMO_SELLERS } from '../config/demoSeller';
import { getDemoFairContext } from '../config/fairContext';
import { isOrderableWine } from './catalog';
import { buildOrder, saveStoredOrder } from './orderProcessing';

/** The only checkout entry point in the public app. Resolve IDs locally;
 * never accept contact details, prices or free text from an order form. */
export function simulateCheckout(lines: readonly { id: string; quantity: number }[],
  customerId: string, sellerId: string, idempotencyKey: string) {
  const customer = INITIAL_DEMO_CUSTOMERS.find(c => c.id === customerId);
  const seller = DEMO_SELLERS.find(s => s.id === sellerId);
  const fairContext = getDemoFairContext();
  if (!customer || !seller || !fairContext || !idempotencyKey.trim()) {
    throw new Error('Simulation benötigt Beispielkunde, Verkäufer, Messe und Vorgangskennung.');
  }
  const items = lines.map(({ id, quantity }) => {
    const wine = CATALOG.find(w => w.id === id);
    if (!wine || !isOrderableWine(wine)) throw new Error('Artikel für die Bestellsimulation nicht freigegeben.');
    return { wine, quantity };
  });
  return saveStoredOrder(buildOrder({ items, customer, seller, fairContext, idempotencyKey }));
}
