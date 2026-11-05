export interface Seller {
  readonly id: string;
  readonly name: string;
  readonly role: string;
}

export const DEMO_SELLERS: readonly Seller[] = [
  { id: 'seller-01', name: 'Demo-Verkäufer 1', role: 'Senior Sommelier' },
  { id: 'seller-02', name: 'Demo-Verkäufer 2', role: 'Weinberaterin' },
  { id: 'seller-03', name: 'Demo-Verkäufer 3', role: 'Kundenberater Messen' },
  { id: 'seller-04', name: 'Demo-Verkäufer 4', role: 'Sommelière' },
];

/** Standard-Verkäufer für die Demo (rückwärtskompatibel zu bestehenden Komponenten) */
export const DEFAULT_DEMO_SELLER = DEMO_SELLERS[0];
export const DEMO_SELLER_NAME = `${DEFAULT_DEMO_SELLER.name} (${DEFAULT_DEMO_SELLER.role})`;
