export type WineCategory = 'all' | 'red' | 'white' | 'rose' | 'sparkling' | 'special';

export interface Wine {
  id: string;
  name: string;
  subTitle?: string;
  category: 'red' | 'white' | 'rose' | 'sparkling' | 'special';
  vintage: number;
  grapeVariety: string;
  region: string;
  appellation?: string;
  bottleSizeCl: number; // e.g. 75
  alcoholVol: number; // e.g. 13.5
  priceCHF: number; // Single bottle price in CHF
  caseSize: number; // e.g. 6
  casePriceCHF: number; // Price for 6 bottles (can include carton discount)
  stockQty: number; // Demo inventory
  description: string;
  tastingNotes: {
    color: string;
    nose: string;
    palate: string;
    finish: string;
  };
  foodPairing: string[];
  servingTempC: string;
  agingPotential: string;
  awards?: string[];
  imageUrl?: string;
  badge?: string; // e.g. "Bestseller", "Messe-Favorit", "Gold-Medaille"
}

export interface WineFilterState {
  category: WineCategory;
  searchQuery: string;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'name-asc' | 'vintage-desc';
}
