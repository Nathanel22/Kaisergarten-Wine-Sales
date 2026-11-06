import { Customer } from './customer';

export interface OrderItemSnapshot {
  readonly priceSource: import('../config/expovina2026').PriceSource;
  readonly wineId: string;
  readonly name: string;
  readonly vintage: number | null;
  readonly grapeVariety: string;
  readonly bottleSizeCl: number | null;
  readonly quantity: number;
  readonly unitPriceRappen: number;
  readonly unitPriceCHF: number;
  readonly lineTotalRappen: number;
  readonly lineTotalCHF: number;
}

export interface OrderPricingSnapshot {
  readonly rawSubtotalRappen: number;
  readonly rawSubtotalCHF: number;
  /** Bestehende Demo-Rabatte ausdrücklich als unbestätigte Annahme gekennzeichnet */
  readonly cartonDiscountRappen: number;
  readonly cartonDiscountCHF: number;
  readonly discountNote: string;
  readonly netSubtotalRappen: number;
  readonly netSubtotalCHF: number;
  readonly finalTotalRappen: number;
  readonly finalTotalCHF: number;
  readonly mwstRappen: number;
  readonly mwstCHF: number;
  readonly roundingDifferenceRappen: number;
}

export interface Order {
  readonly mode: 'SIMULATION';
  readonly id: string; // e.g. "KG-20261105-8492"
  /** Eindeutige Kennung des Checkout-Vorgangs zur Verhinderung von doppelten Bestellungen */
  readonly idempotencyKey: string;
  readonly createdAt: string; // ISO-8601
  readonly formattedDate: string; // e.g. "05.11.2026, 14:32 Uhr"
  readonly status: 'completed' | 'cancelled';

  // Messe- & Tabletkontext (historisch gesichert)
  readonly fairId: string;
  readonly fairName: string;
  readonly booth: string;
  readonly tabletId: string;

  // Verkäufer (Pflichtfeld, historisch gesichert)
  readonly sellerId: string;
  readonly sellerName: string;
  readonly sellerRole?: string;

  // Kunde (vollständiger Snapshot)
  readonly customer: Customer;

  // Positionen und Gebinde
  readonly items: readonly OrderItemSnapshot[];
  readonly totalBottles: number;
  readonly totalWineBottles: number;
  readonly completeCases: number;

  // Preisberechnung (historisch unveränderlich)
  readonly pricing: OrderPricingSnapshot;

  readonly notes?: string;
}

export interface CreateOrderParams {
  readonly items: readonly {
    wine: {
      id: string;
      name: string;
      vintage: number | null;
      grapeVariety: string;
      bottleSizeCl: number | null;
      priceCHF: number;
      category: string;
      sourceId?: string;
      cartonRule?: 'standard-6' | 'unconfirmed' | 'excluded';
      caseSize?: number | null;
      casePriceCHF?: number | null;
    };
    quantity: number;
  }[];
  readonly fairContext: {
    fairId: string;
    fairName: string;
    booth: string;
    tabletId: string;
  };
  readonly seller: {
    id: string;
    name: string;
    role?: string;
  };
  readonly customer: Customer;
  readonly notes?: string;
  /** Optionale oder generierte Idempotenz-Kennung */
  readonly idempotencyKey?: string;
}

export interface SaveOrderResult {
  readonly success: boolean;
  readonly order: Order;
  readonly isDuplicate: boolean;
  readonly errorMessage?: string;
}
