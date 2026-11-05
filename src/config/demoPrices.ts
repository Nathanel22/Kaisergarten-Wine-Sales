/**
 * Preparation only: no prices are assigned and this configuration is not used
 * for checkout. Official prices remain exclusively in data/products.json.
 * Activation requires approved values, package rules and explicit demo labels
 * throughout catalog, cart, checkout and historical order snapshots.
 */
export interface DemoPriceEntry {
  readonly productId: string;
  readonly demoUnitPriceCHF: number;
  readonly demoCasePriceCHF: number | null;
  readonly priceSource: 'demo';
  readonly label: 'Demopreis – kein Verkaufspreis';
}

export interface DemoPriceConfiguration {
  readonly enabled: boolean;
  readonly entries: readonly DemoPriceEntry[];
}

export const DEMO_PRICE_CONFIGURATION: DemoPriceConfiguration = {
  enabled: false,
  entries: [],
};
