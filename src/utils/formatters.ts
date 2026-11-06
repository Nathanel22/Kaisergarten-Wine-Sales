/**
 * Kaufmännische Rundung nach Schweizer Standard auf 5 Rappen (0.05 CHF)
 */
export function roundCHF(amount: number): number {
  return Math.round(amount * 20) / 20;
}

/**
 * Rechnet CHF in ganzzahlige Rappen um (1 CHF = 100 Rappen)
 */
export function chfToRappen(chf: number): number {
  return Math.round(chf * 100);
}

/**
 * Rechnet ganzzahlige Rappen in CHF um
 */
export function rappenToCHF(rappen: number): number {
  return rappen / 100;
}

/**
 * Kaufmännische 5-Rappen-Rundung direkt auf Rappenbetrag (nur für Zahlbetrag)
 */
export function roundRappen5(rappen: number): number {
  return Math.round(rappen / 5) * 5;
}

/**
 * Formatiert Beträge konsistent im Schweizer Standardformat
 * Beispiel: CHF 24.50
 */
export function formatCHF(amount: number): string {
  const rounded = roundCHF(amount);
  return `CHF ${rounded.toFixed(2)}`;
}

/**
 * Formatiert ganzzahlige Rappen im Schweizer Standardformat
 */
export const formatDemoCHF = (amount: number) => `DEMO-PREIS ${formatCHF(amount)}`;

export function formatRappen(rappen: number): string {
  return formatCHF(rappenToCHF(rappen));
}

/**
 * Textuelle Zusammenfassung von Flaschen und Kartons (Standard: 6er-Karton)
 */
export function formatBottlesSummary(quantity: number, caseSize: number = 6): string {
  if (quantity <= 0) return '0 Flaschen';
  const cases = Math.floor(quantity / caseSize);
  const singles = quantity % caseSize;

  const parts: string[] = [];
  if (cases > 0) {
    parts.push(`${cases} ${cases === 1 ? 'Karton' : 'Kartons'} à ${caseSize}`);
  }
  if (singles > 0) {
    parts.push(`${singles} ${singles === 1 ? 'Einzelflasche' : 'Einzelflaschen'}`);
  }

  return `${quantity} ${quantity === 1 ? 'Flasche' : 'Flaschen'} (${parts.join(', ')})`;
}
