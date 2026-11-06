export type WineCategory = 'all' | 'red' | 'white' | 'rose' | 'sparkling' | 'dessert' | 'spirits' | 'special';

export interface Wine {
  id: string;
  demoClassification?: import('../config/demoPrices').DemoClassification;
  name: string;
  subTitle?: string;
  category: Exclude<WineCategory, 'all'>;
  vintage: number | null;
  grapeVariety: string;
  region: string;
  appellation?: string;
  bottleSizeCl: number | null;
  alcoholVol: number | null;
  priceCHF: number | null; // null means unknown, never a free product
  caseSize: number | null;
  casePriceCHF: number | null;
  stockQty: number | null;
  country?: string;
  flavor?: string;
  residualSugarGL?: number | null;
  acidityGL?: number | null;
  alcoholNote?: string;
  packagingNote?: string;
  sourceId?: string;
  sourceUrl?: string;
  sourceCategory?: string;
  originalImageUrl?: string | null;
  downloadedImageUrl?: string | null;
  rawAttributes?: Record<string, string | undefined>;
  dataIssues?: string[];
  cartonRule?: 'standard-6' | 'unconfirmed' | 'excluded';
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
  imageUrl?: string | null;
  badge?: string; // e.g. "Bestseller", "Messe-Favorit", "Gold-Medaille"
}

export type PricedWine = Wine & { priceCHF: number };

export interface WineFilterState {
  category: WineCategory;
  searchQuery: string;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'name-asc' | 'vintage-desc';
}
