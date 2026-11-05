import snapshot from './products.json';
import { Wine } from '../types/wine';

/** Local source adapter. Replace this boundary for a future centrally maintained catalog. */
export const CATALOG: Wine[] = snapshot.products.map((product) => ({
  ...product,
  category: product.category as Wine['category'],
  cartonRule: product.cartonRule as Wine['cartonRule'],
  tastingNotes: { color: '', nose: '', palate: '', finish: '' },
  foodPairing: [],
  servingTempC: '',
  agingPotential: '',
}));

export const CATALOG_CHECKED_AT = snapshot.checkedAt;
