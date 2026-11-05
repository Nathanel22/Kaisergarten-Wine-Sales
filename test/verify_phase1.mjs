// Automated verification of Kaisergarten Wine Sales Phase 1 Core Logic
import assert from 'node:assert/strict';

console.log('--- TESTSUITE: Kaisergarten Wine Sales Phase 1 ---\n');

// 1. Test Schweizer Rappen-Rundung (5 Rappen / 0.05 CHF)
function roundCHF(amount) {
  return Math.round(amount * 20) / 20;
}

function formatCHF(amount) {
  const rounded = roundCHF(amount);
  return `CHF ${rounded.toFixed(2)}`;
}

function formatBottlesSummary(quantity, caseSize = 6) {
  if (quantity <= 0) return '0 Flaschen';
  const cases = Math.floor(quantity / caseSize);
  const singles = quantity % caseSize;

  const parts = [];
  if (cases > 0) {
    parts.push(`${cases} ${cases === 1 ? 'Karton' : 'Kartons'} à ${caseSize}`);
  }
  if (singles > 0) {
    parts.push(`${singles} ${singles === 1 ? 'Einzelflasche' : 'Einzelflaschen'}`);
  }

  return `${quantity} ${quantity === 1 ? 'Flasche' : 'Flaschen'} (${parts.join(', ')})`;
}

// Tests für Rundung
console.log('1. Teste Schweizer 5-Rappen-Rundung & Formatierung:');
assert.equal(roundCHF(24.52), 24.50);
assert.equal(roundCHF(24.53), 24.55);
assert.equal(roundCHF(24.57), 24.55);
assert.equal(roundCHF(24.58), 24.60);
assert.equal(roundCHF(19.99), 20.00);
assert.equal(formatCHF(24.5), 'CHF 24.50');
assert.equal(formatCHF(195), 'CHF 195.00');
console.log('  ✓ 5-Rappen-Rundung & Formatierung erfolgreich validiert.');

// Tests für Zusammenfassung
console.log('2. Teste Flaschen- und Kartonzusammenfassung:');
assert.equal(formatBottlesSummary(0), '0 Flaschen');
assert.equal(formatBottlesSummary(1), '1 Flasche (1 Einzelflasche)');
assert.equal(formatBottlesSummary(6), '6 Flaschen (1 Karton à 6)');
assert.equal(formatBottlesSummary(7), '7 Flaschen (1 Karton à 6, 1 Einzelflasche)');
assert.equal(formatBottlesSummary(14), '14 Flaschen (2 Kartons à 6, 2 Einzelflaschen)');
console.log('  ✓ Mengen-Formatierung erfolgreich validiert.');

// 3. Teste Warenkorb-Kalkulation & Messe-Rabatt
console.log('3. Teste Warenkorb-Kalkulation mit Kartonvorteil & Messerabatt:');
function calculateCartSummary(items) {
  let totalBottles = 0;
  let rawSubtotalCHF = 0;
  let cartonDiscountCHF = 0;

  for (const item of items) {
    totalBottles += item.quantity;
    const singlePrice = item.wine.priceCHF;
    const caseSize = item.wine.caseSize || 6;
    const casePrice = item.wine.casePriceCHF || singlePrice * caseSize;

    const itemRawTotal = singlePrice * item.quantity;
    rawSubtotalCHF += itemRawTotal;

    const fullCases = Math.floor(item.quantity / caseSize);
    const remainderSingles = item.quantity % caseSize;
    
    const itemActualTotal = fullCases * casePrice + remainderSingles * singlePrice;
    const itemDiscount = itemRawTotal - itemActualTotal;
    if (itemDiscount > 0) {
      cartonDiscountCHF += itemDiscount;
    }
  }

  const subtotalAfterCases = rawSubtotalCHF - cartonDiscountCHF;
  let messeBonusCHF = 0;
  if (totalBottles >= 12) {
    messeBonusCHF = subtotalAfterCases * 0.05;
  }

  const totalDiscount = cartonDiscountCHF + messeBonusCHF;
  const netCalculated = Math.max(0, rawSubtotalCHF - totalDiscount);
  const finalTotalCHF = roundCHF(netCalculated);
  const mwstCHF = roundCHF(finalTotalCHF - finalTotalCHF / 1.081);

  return {
    totalBottles,
    rawSubtotalCHF: roundCHF(rawSubtotalCHF),
    cartonDiscountCHF: roundCHF(totalDiscount),
    mwstCHF,
    finalTotalCHF,
  };
}

// Fall A: 1 Flasche Pinot Noir (34.50 CHF)
const pinotNoir = {
  id: 'pn',
  priceCHF: 34.50,
  caseSize: 6,
  casePriceCHF: 195.00, // 12 CHF Rabatt pro 6er-Karton
};

const cartA = calculateCartSummary([{ wine: pinotNoir, quantity: 1 }]);
assert.equal(cartA.totalBottles, 1);
assert.equal(cartA.rawSubtotalCHF, 34.50);
assert.equal(cartA.cartonDiscountCHF, 0);
assert.equal(cartA.finalTotalCHF, 34.50);
console.log('  ✓ Einzelflasche korrekt ohne Rabatt berechnet.');

// Fall B: 6 Flaschen Pinot Noir (1 voller Karton: 195.00 CHF statt 207.00 CHF)
const cartB = calculateCartSummary([{ wine: pinotNoir, quantity: 6 }]);
assert.equal(cartB.totalBottles, 6);
assert.equal(cartB.rawSubtotalCHF, 207.00);
assert.equal(cartB.cartonDiscountCHF, 12.00); // 207 - 195 = 12 CHF
assert.equal(cartB.finalTotalCHF, 195.00);
console.log('  ✓ 6er-Kartonvorteil exakt berechnet (195.00 CHF).');

// Fall C: 12 Flaschen Pinot Noir (2 Kartons à 195 = 390 CHF, plus 5% Messerabatt = 19.50 CHF Rabatt)
// Total: 390 - 19.50 = 370.50 CHF
const cartC = calculateCartSummary([{ wine: pinotNoir, quantity: 12 }]);
assert.equal(cartC.totalBottles, 12);
assert.equal(cartC.rawSubtotalCHF, 414.00);
// Kartonrabatt: 2 * 12 = 24 CHF. Zwischensumme = 390. 5% Bonus = 19.50 CHF. Total Rabatt = 43.50 CHF.
assert.equal(cartC.cartonDiscountCHF, 43.50);
assert.equal(cartC.finalTotalCHF, 370.50);
console.log('  ✓ 12+ Flaschen Mengen- & Messerabatt korrekt berechnet (370.50 CHF).');

// 4. Teste Filter- und Suchlogik
console.log('4. Teste Sortiments-Filter und Suchfunktionen:');
const sampleWines = [
  { name: 'Pinot Noir Réserve', category: 'red', vintage: 2022, priceCHF: 34.50 },
  { name: 'Chardonnay Grand Terroir', category: 'white', vintage: 2023, priceCHF: 31.00 },
  { name: 'Kaisergarten Crémant', category: 'sparkling', vintage: 2021, priceCHF: 36.00 },
];

// Filter nach Rotwein
const redOnly = sampleWines.filter(w => w.category === 'red');
assert.equal(redOnly.length, 1);
assert.equal(redOnly[0].name, 'Pinot Noir Réserve');

// Textsuche nach 'Chard'
const searchRes = sampleWines.filter(w => w.name.toLowerCase().includes('chard'));
assert.equal(searchRes.length, 1);
assert.equal(searchRes[0].name, 'Chardonnay Grand Terroir');

// Sortierung nach Preis aufsteigend
const sortedByPrice = [...sampleWines].sort((a, b) => a.priceCHF - b.priceCHF);
assert.equal(sortedByPrice[0].priceCHF, 31.00);
assert.equal(sortedByPrice[2].priceCHF, 36.00);
console.log('  ✓ Filter-, Such- und Sortierlogik erfolgreich validiert.');

console.log('\n--- ALLE PHASE-1 TESTS ERFOLGREICH BESTANDEN (100%) ---');
