import { fairPrice } from './expovina2026';

/** Explicitly reviewed IDs. Newly imported products stay display-only until reviewed. */
const STANDARD_SHOP_IDS = new Set([
  '1092963', '1092977', '1092980', '1092982', '1092984', '1092988', '1092990', '1092992',
  '1092994', '1092996', '1092998', '1093000', '1093002', '1093004', '1093006', '1093008',
  '1093012', '1093014', '1093016', '1093018', '1093020', '1093022', '1093024', '1093026',
  '1093028', '1093030', '1093032', '1093034', '1093036', '1093038', '1093040', '1093042',
  '1093044', '1093046', '1093048', '1093050', '1093052', '1093054', '1093056', '1093058',
  '1093060', '1093064', '1093066', '1093068', '1093070', '1093072', '1093074',
  '1093076', '1093078', '1093082', '1093084', '1093088', '1093090', '1093092', '1093094',
]);

export const DEMO_UNIT_PRICE_CHF = 25;
export type DemoClassification = 'DEMO_STANDARD' | 'DEMO_SONDERPRODUKT';

export function demoClassification(sourceId?: string): DemoClassification {
  return sourceId && STANDARD_SHOP_IDS.has(sourceId) ? 'DEMO_STANDARD' : 'DEMO_SONDERPRODUKT';
}

export function simulationPriceCHF(sourceId?: string): number | null {
  const confirmed = fairPrice(sourceId);
  if (confirmed) return confirmed.priceRappen / 100;
  return demoClassification(sourceId) === 'DEMO_STANDARD' ? DEMO_UNIT_PRICE_CHF : null;
}

export function hasDemoQuote(wine: { id: string; sourceId?: string; priceCHF: number | null }): boolean {
  return demoClassification(wine.sourceId) === 'DEMO_STANDARD'
    && wine.id === `kg-shop-${wine.sourceId}` && wine.priceCHF === simulationPriceCHF(wine.sourceId);
}
