import rows from '../data/expovina2026Prices.json';

export type PriceSource = 'DEMO-PREIS' | 'MESSEPREIS 2026';
const confirmed = new Map(rows.map(row => [row.shopId, row]));
export const fairPrice = (shopId?: string) => shopId ? confirmed.get(shopId) : undefined;
export const sourceFor = (shopId?: string): PriceSource => fairPrice(shopId) ? 'MESSEPREIS 2026' : 'DEMO-PREIS';

/** Laut Auftrag separat ausgewiesene Pauschale. Die Anwendung berechnet sie
 * erst, wenn die Bedingungen für ihre Anwendung fachlich bestätigt sind. */
export const EXPOVINA_2026_DELIVERY = {
  flatFeeRappen: 2000,
  applyAutomatically: false,
} as const;
