import { hasDemoQuote } from '../config/demoPrices';
import { PricedWine, Wine, WineFilterState } from '../types/wine';
import { CartItem } from '../types/cart';

export function isOrderableWine(wine: Wine): wine is PricedWine {
  return typeof wine.priceCHF === 'number' && Number.isFinite(wine.priceCHF) && wine.priceCHF > 0
    && hasDemoQuote(wine);
}

export function orderabilityMessage(wine: Wine): string {
  return wine.priceCHF == null || !Number.isFinite(wine.priceCHF) || wine.priceCHF <= 0
    ? 'Preis noch nicht hinterlegt'
    : 'Gebinde und Bestellfreigabe noch nicht bestätigt';
}

const compareNullable = (a: number | null, b: number | null, descending = false) =>
  a == null ? (b == null ? 0 : 1) : b == null ? -1 : (descending ? b - a : a - b);

export function filterCatalog(catalog: readonly Wine[], filter: WineFilterState): Wine[] {
  const query = filter.searchQuery.trim().toLocaleLowerCase('de-CH');
  const list = catalog.filter(wine => (filter.category === 'all' || wine.category === filter.category)
    && [wine.name, wine.grapeVariety, wine.country, wine.region, wine.appellation, wine.vintage,
      wine.description, wine.flavor, wine.sourceId].join(' ').toLocaleLowerCase('de-CH').includes(query));
  switch (filter.sortBy) {
    case 'price-asc': return list.sort((a, b) => compareNullable(a.priceCHF, b.priceCHF));
    case 'price-desc': return list.sort((a, b) => compareNullable(a.priceCHF, b.priceCHF, true));
    case 'vintage-desc': return list.sort((a, b) => compareNullable(a.vintage, b.vintage, true));
    case 'name-asc': return list.sort((a, b) => a.name.localeCompare(b.name, 'de-CH'));
    default: return list;
  }
}

/** Never trust persisted product snapshots: discard retired IDs and refresh prices from the catalog. */
export function restoreCatalogCart(saved: unknown, catalog: readonly Wine[]): CartItem[] {
  if (!Array.isArray(saved)) return [];
  const result: CartItem[] = [];
  for (const entry of saved) {
    const wine = catalog.find(w => w.id === entry?.wine?.id);
    if (!wine || !isOrderableWine(wine) || !Number.isSafeInteger(entry.quantity) || entry.quantity <= 0) continue;
    const existing = result.find(item => item.wine.id === wine.id);
    if (existing) {
      if (Number.isSafeInteger(existing.quantity + entry.quantity)) existing.quantity += entry.quantity;
    } else result.push({ wine, quantity: entry.quantity });
  }
  return result;
}
