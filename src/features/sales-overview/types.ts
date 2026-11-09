/**
 * Minimale Schnittstelle. Die Übersicht kennt NUR diese Felder und hat keinen eigenen Datenbestand.
 * Die bestehende App bildet ihre Bestellungen per Mapper auf `OverviewOrder` ab (siehe HANDOVER).
 * Beträge sind ganzzahlige Rappen.
 */
export interface OverviewLine { qty: number; unitPriceRappen: number }
export interface OverviewOrder {
  id: string;
  sellerId: string;
  fairId: string;
  /** ISO-8601-Zeitstempel der Bestellung */
  createdAt: string;
  lines: OverviewLine[];
  /** Final amount from the immutable order snapshot, including historical rounding/discounts. */
  totalRappen?: number;
  example?: boolean;
  /** Stornierte Bestellungen werden nicht mitgezählt */
  cancelled?: boolean;
}
export interface OverviewSeller { id: string; name: string }
export interface OverviewFair { id: string; name: string }

export type Period = 'today' | 'week' | 'month' | 'fair';
export type Metric = 'revenue' | 'orders' | 'bottles';

export interface SellerStats { sellerId: string; name: string; orders: number; bottles: number; revenueRappen: number; orderList: OverviewOrder[] }
export interface OverviewStats { orders: number; bottles: number; revenueRappen: number; sellersWithOrders: number; sellerCount: number; sellers: SellerStats[] }
