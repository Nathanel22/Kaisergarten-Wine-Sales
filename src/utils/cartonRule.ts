import { hasDemoQuote } from '../config/demoPrices';
import { Wine } from '../types/wine';
import { CartItem } from '../types/cart';

/**
 * Prüft, ob ein Produkt der verbindlichen 6er-Weinkartonregel unterliegt.
 * Shopartikel zählen allein nach der freigegebenen Simulationsliste, unabhängig vom realen Volumen.
 * Spirituosen und Sonderprodukte (Kategorie 'special') bleiben vorerst separat.
 */
export function isWineCartonProduct(wine: Pick<Wine, 'id' | 'sourceId' | 'priceCHF' | 'cartonRule'> & {category: string}): boolean {
  if (wine.sourceId) return hasDemoQuote(wine);
  return wine.cartonRule ? wine.cartonRule === 'standard-6' : !['special', 'spirits', 'dessert'].includes(wine.category);
}

export interface CartonValidationResult {
  readonly totalWineBottles: number;
  readonly otherProductsCount: number;
  readonly isValid: boolean;
  readonly completeCases: number;
  readonly missingBottlesToNextCase: number;
  readonly excessBottles: number;
  readonly canCheckout: boolean;
  readonly statusMessage: string;
  readonly detailedExplanation: string;
}

/**
 * Validiert die verbindliche Kartonregel für eine Liste von Warenkorb-Positionen.
 * - Gesamtzahl Weinflaschen muss ein positives Vielfaches von 6 sein (> 0 und % 6 === 0).
 * - Einzelne Weinsorten dürfen frei zu Mischkartons kombiniert werden.
 */
export function validateCartonRule(items: readonly CartItem[]): CartonValidationResult {
  let totalWineBottles = 0;
  let otherProductsCount = 0;

  for (const item of items) {
    if (isWineCartonProduct(item.wine)) {
      totalWineBottles += item.quantity;
    } else {
      otherProductsCount += item.quantity;
    }
  }

  const remainder = totalWineBottles % 6;
  const completeCases = Math.floor(totalWineBottles / 6);
  const isValid = totalWineBottles > 0 && remainder === 0;
  const missingBottlesToNextCase = totalWineBottles === 0 ? 6 : (remainder === 0 ? 0 : 6 - remainder);

  let statusMessage: string;
  let detailedExplanation: string;

  if (totalWineBottles === 0) {
    statusMessage = 'Noch keine Weine im Warenkorb';
    detailedExplanation = 'Wählen Sie mindestens 6 Weinflaschen aus. Für die Simulation zählt jede Gruppe von sechs Flaschen als vollständiger Karton.';
  } else if (isValid) {
    statusMessage = `${completeCases} vollständige${completeCases === 1 ? 'r' : ''} 6er-Karton${completeCases === 1 ? '' : 's'} (${totalWineBottles} Flaschen)`;
    detailedExplanation = completeCases >= 2
      ? `Kartonregel erfüllt: ${completeCases} vollständige 6er-Kartons (${totalWineBottles} Flaschen). Weine dürfen beliebig sortenrein oder gemischt kombiniert werden.`
      : `Kartonregel erfüllt: 1 vollständiger 6er-Karton (6 Flaschen). Weine dürfen beliebig sortenrein oder gemischt kombiniert werden.`;
  } else {
    statusMessage = `Noch ${missingBottlesToNextCase} Flasche${missingBottlesToNextCase === 1 ? '' : 'n'} bis zum vollständigen Karton`;
    const nextTarget = totalWineBottles + missingBottlesToNextCase;
    detailedExplanation = `Aktuell ${totalWineBottles} Flasche${totalWineBottles === 1 ? '' : 'n'}. Ergänzen Sie noch ${missingBottlesToNextCase} Flasche${missingBottlesToNextCase === 1 ? '' : 'n'} für ${nextTarget / 6} vollständige 6er-Karton(s) (${nextTarget} Flaschen).`;
  }

  return {
    totalWineBottles,
    otherProductsCount,
    isValid,
    completeCases,
    missingBottlesToNextCase,
    excessBottles: remainder,
    canCheckout: isValid,
    statusMessage,
    detailedExplanation,
  };
}
