import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

console.log('--- TESTSUITE: Kaisergarten Wine Sales Phase 2 ---\n');

// In-Memory-Mock für localStorage in Node-Umgebung
const storageMap = new Map();
globalThis.localStorage = {
  getItem: (k) => storageMap.get(k) || null,
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k),
  clear: () => storageMap.clear(),
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-Memory-Loader für TypeScript-Module (ohne Duplikation von Logik)
function loadTs(relativeFilePath) {
  const fullPath = path.resolve(__dirname, relativeFilePath);
  if (fullPath.endsWith('.json')) return {default: JSON.parse(fs.readFileSync(fullPath,'utf8'))};
  const resolved = fullPath.endsWith('.ts') ? fullPath : fullPath + '.ts';
  const code = fs.readFileSync(resolved, 'utf8');
  const { outputText } = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const m = { exports: {} };
  const customRequire = (id) => {
    if (id.startsWith('.')) {
      return loadTs(path.resolve(path.dirname(resolved), id));
    }
    throw new Error(`External require not supported in test loader: ${id}`);
  };
  const fn = new Function('require', 'exports', 'module', outputText);
  fn(customRequire, m.exports, m);
  return m.exports;
}

// Echte Quelldateien laden
const { isWineCartonProduct, validateCartonRule } = loadTs('../src/utils/cartonRule.ts');
const { validateCustomerData } = loadTs('../src/types/customer.ts');
const { chfToRappen, rappenToCHF, roundRappen5, formatCHF } = loadTs('../src/utils/formatters.ts');
const { validateOrderParams, buildOrder, saveStoredOrder } = loadTs('../src/utils/orderProcessing.ts');
const { DEMO_SELLERS, DEFAULT_DEMO_SELLER } = loadTs('../src/config/demoSeller.ts');
const { FAIR_CONFIGURATION, resolveFairContext } = loadTs('../src/config/fairContext.ts');

// Mock-Weine für Tests
const winePinot = {
  id: 'kg-pinot',
  name: 'Pinot Noir Réserve',
  category: 'red',
  vintage: 2022,
  grapeVariety: 'Pinot Noir',
  bottleSizeCl: 75,
  priceCHF: 34.50,
  caseSize: 6,
  casePriceCHF: 195.00,
};

const wineChardonnay = {
  id: 'kg-chardonnay',
  name: 'Chardonnay Grand Terroir',
  category: 'white',
  vintage: 2023,
  grapeVariety: 'Chardonnay',
  bottleSizeCl: 75,
  priceCHF: 31.00,
  caseSize: 6,
  casePriceCHF: 175.00,
};

const wineMerlot = {
  id: 'kg-merlot',
  name: 'Merlot Riserva',
  category: 'red',
  vintage: 2021,
  grapeVariety: 'Merlot',
  bottleSizeCl: 75,
  priceCHF: 42.00,
  caseSize: 6,
  casePriceCHF: 238.00,
};

const iceWineSpecial = {
  id: 'kg-ice',
  name: 'Kaisergarten Eiswein Nobilis',
  category: 'special', // Sonderprodukt
  vintage: 2022,
  grapeVariety: 'Riesling',
  bottleSizeCl: 37.5,
  priceCHF: 48.00,
  caseSize: 6,
  casePriceCHF: 270.00,
};

// -------------------------------------------------------------
// 1. Tests für verbindliche Kartonregel (0, 5, 6, 7, 12, 18, 24 Flaschen)
// -------------------------------------------------------------
console.log('1. Teste verbindliche Kartonregel (0, 5, 6, 7, 12, 18, 24 Flaschen):');

// 0 Flaschen
const res0 = validateCartonRule([]);
assert.equal(res0.isValid, false, '0 Flaschen dürfen nicht gültig sein');
assert.equal(res0.canCheckout, false, '0 Flaschen dürfen keinen Checkout erlauben');
assert.equal(res0.missingBottlesToNextCase, 6, '0 Flaschen: 6 Flaschen bis zum ersten Karton nötig');
console.log('  ✓ 0 Flaschen: Checkout gesperrt, 6 Flaschen nötig');

// 5 Flaschen (ungültig)
const res5 = validateCartonRule([{ wine: winePinot, quantity: 5 }]);
assert.equal(res5.isValid, false, '5 Flaschen dürfen nicht gültig sein');
assert.equal(res5.canCheckout, false, '5 Flaschen dürfen keinen Checkout erlauben');
assert.equal(res5.missingBottlesToNextCase, 1, '5 Flaschen: noch 1 Flasche bis zum 6er-Karton nötig');
console.log('  ✓ 5 Flaschen: Checkout gesperrt, 1 Flasche fehlend');

// 6 Flaschen (gültig)
const res6 = validateCartonRule([{ wine: winePinot, quantity: 6 }]);
assert.equal(res6.isValid, true, '6 Flaschen müssen gültig sein');
assert.equal(res6.canCheckout, true, '6 Flaschen müssen Checkout erlauben');
assert.equal(res6.completeCases, 1, '6 Flaschen = 1 vollständiger Karton');
assert.equal(res6.missingBottlesToNextCase, 0, '6 Flaschen: 0 Flaschen fehlend');
console.log('  ✓ 6 Flaschen: Gültig (1 vollständiger 6er-Karton)');

// 7 Flaschen (ungültig)
const res7 = validateCartonRule([{ wine: winePinot, quantity: 7 }]);
assert.equal(res7.isValid, false, '7 Flaschen dürfen nicht gültig sein');
assert.equal(res7.canCheckout, false, '7 Flaschen dürfen keinen Checkout erlauben');
assert.equal(res7.missingBottlesToNextCase, 5, '7 Flaschen: 5 Flaschen bis zu 12 nötig');
assert.equal(res7.completeCases, 1, '7 Flaschen enthalten 1 vollen Karton');
console.log('  ✓ 7 Flaschen: Checkout gesperrt, 5 Flaschen bis 12 nötig');

// 12 Flaschen (gültig)
const res12 = validateCartonRule([{ wine: winePinot, quantity: 12 }]);
assert.equal(res12.isValid, true, '12 Flaschen müssen gültig sein');
assert.equal(res12.canCheckout, true);
assert.equal(res12.completeCases, 2, '12 Flaschen = 2 vollständige Kartons');
console.log('  ✓ 12 Flaschen: Gültig (2 vollständige Kartons)');

// 18 Flaschen (gültig)
const res18 = validateCartonRule([{ wine: winePinot, quantity: 18 }]);
assert.equal(res18.isValid, true, '18 Flaschen müssen gültig sein');
assert.equal(res18.completeCases, 3, '18 Flaschen = 3 vollständige Kartons');
console.log('  ✓ 18 Flaschen: Gültig (3 vollständige Kartons)');

// 24 Flaschen (gültig)
const res24 = validateCartonRule([{ wine: winePinot, quantity: 24 }]);
assert.equal(res24.isValid, true, '24 Flaschen müssen gültig sein');
assert.equal(res24.completeCases, 4, '24 Flaschen = 4 vollständige Kartons');
console.log('  ✓ 24 Flaschen: Gültig (4 vollständige Kartons)');

// -------------------------------------------------------------
// 2. Tests für Gemischte Weinkartons & Sonderprodukte
// -------------------------------------------------------------
console.log('\n2. Teste gemischte Weinkartons & Sonderprodukte:');

// Gemischt: 3 Pinot + 3 Chardonnay = 6 Flaschen (gültig)
const mixed6 = validateCartonRule([
  { wine: winePinot, quantity: 3 },
  { wine: wineChardonnay, quantity: 3 },
]);
assert.equal(mixed6.isValid, true);
assert.equal(mixed6.totalWineBottles, 6);
assert.equal(mixed6.completeCases, 1);
console.log('  ✓ 3 Pinot + 3 Chardonnay = 6 Flaschen (gültiger Mischkarton)');

// Gemischt: 2 Pinot + 2 Chardonnay + 1 Merlot = 5 Flaschen (ungültig)
const mixed5 = validateCartonRule([
  { wine: winePinot, quantity: 2 },
  { wine: wineChardonnay, quantity: 2 },
  { wine: wineMerlot, quantity: 1 },
]);
assert.equal(mixed5.isValid, false);
assert.equal(mixed5.totalWineBottles, 5);
assert.equal(mixed5.missingBottlesToNextCase, 1);
console.log('  ✓ 2 Pinot + 2 Chardonnay + 1 Merlot = 5 Flaschen (ungültig)');

// Sonderprodukt (Eiswein) unterliegt nicht der Wein-Kartonregel
assert.equal(isWineCartonProduct(iceWineSpecial), false, 'Sonderprodukt zählt nicht zur Wein-Kartonregel');
const withSpecial = validateCartonRule([
  { wine: winePinot, quantity: 6 },
  { wine: iceWineSpecial, quantity: 1 },
]);
assert.equal(withSpecial.totalWineBottles, 6);
assert.equal(withSpecial.otherProductsCount, 1);
assert.equal(withSpecial.isValid, true, 'Weine erfüllen Kartonregel unabhängig von Sonderprodukt');
console.log('  ✓ Sonderprodukt (Eiswein) separat von Weinkartonregel geführt');

// -------------------------------------------------------------
// 3. Tests für Neukundenanlage, Kundenauswahl & Fehlerhafte Eingaben
// -------------------------------------------------------------
console.log('\n3. Teste Kundendaten-Validierung & Fehlerfälle:');

const validCustomer = {
  id: 'KND-TEST-1',
  salutation: 'Herr',
  firstName: 'Demo',
  lastName: 'Testkunde',
  street: 'Fiktive Testadresse 0',
  zip: '8001',
  city: 'Zürich',
  canton: 'ZH',
  country: 'Schweiz',
  email: 'qa@example.invalid',
  phone: '',
  createdAt: new Date().toISOString(),
};

const valRes = validateCustomerData(validCustomer);
assert.equal(valRes.isValid, true);
assert.equal(Object.keys(valRes.errors).length, 0);
console.log('  ✓ Gültiger Schweizer Kunde erfolgreich validiert');

// Fehlerfall 1: Fehlender Nachname
const errNoLastName = validateCustomerData({ ...validCustomer, lastName: '' });
assert.equal(errNoLastName.isValid, false);
assert.ok(errNoLastName.errors.lastName, 'Nachname muss bemängelt werden');
console.log('  ✓ Fehlender Nachname wird abgefangen');

// Fehlerfall 2: Ungültige PLZ (3 Ziffern oder Text)
const errZip3 = validateCustomerData({ ...validCustomer, zip: '800' });
assert.equal(errZip3.isValid, false);
assert.ok(errZip3.errors.zip, '3-stellige PLZ muss ungültig sein');

const errZipText = validateCustomerData({ ...validCustomer, zip: 'ABCD' });
assert.equal(errZipText.isValid, false);
assert.ok(errZipText.errors.zip, 'Textuelle PLZ muss ungültig sein');
console.log('  ✓ Ungültige Schweizer PLZ ("800", "ABCD") wird abgefangen');

// Fehlerfall 3: Ungültiges E-Mail-Format
const errEmail = validateCustomerData({ ...validCustomer, email: 'ungueltiges-email' });
assert.equal(errEmail.isValid, false);
assert.ok(errEmail.errors.email, 'Ungültiges E-Mail-Format muss bemängelt werden');
console.log('  ✓ Ungültige E-Mail-Adresse wird abgefangen');

// Fehlerfall 4: Weder E-Mail noch Telefon
const errNoContact = validateCustomerData({ ...validCustomer, email: '', phone: '' });
assert.equal(errNoContact.isValid, false);
assert.ok(errNoContact.errors.contact, 'Fehlende Kontaktmöglichkeit muss bemängelt werden');
console.log('  ✓ Fehlender Kontakt (weder E-Mail noch Tel) wird abgefangen');

// -------------------------------------------------------------
// 4. Tests für Verkäuferpflicht & Messezuordnung
// -------------------------------------------------------------
console.log('\n4. Teste Verkäuferpflicht & Messezuordnung:');

const validFairContext = {
  fairId: 'expovina-weinschiffe',
  fairName: 'Expovina Weinschiffe',
  booth: 'Demo-Stand 01',
  tabletId: 'TABLET-01',
};

const validSeller = DEFAULT_DEMO_SELLER;

const validOrderParams = {
  items: [{ wine: winePinot, quantity: 6 }],
  fairContext: validFairContext,
  seller: validSeller,
  customer: validCustomer,
};

const validOrderValidation = validateOrderParams(validOrderParams);
assert.equal(validOrderValidation.isValid, true);
console.log('  ✓ Gültige Bestelldaten passieren Validierung');

// Test Verkäuferpflicht: Fehlender Verkäufer
const invalidSellerParams = {
  ...validOrderParams,
  seller: { id: '', name: '' },
};
const sellerValidation = validateOrderParams(invalidSellerParams);
assert.equal(sellerValidation.isValid, false);
assert.ok(sellerValidation.errors.some(e => e.includes('Verkäufer')), 'Fehlender Verkäufer muss abgefangen werden');
console.log('  ✓ Verkäuferpflicht durchgesetzt: Bestellung ohne Verkäufer abgelehnt');

// Test Messezuordnung: Fehlender Stand
const invalidFairParams = {
  ...validOrderParams,
  fairContext: { ...validFairContext, booth: '' },
};
const fairValidation = validateOrderParams(invalidFairParams);
assert.equal(fairValidation.isValid, false);
assert.ok(fairValidation.errors.some(e => e.includes('Messe')), 'Fehlende Messezuordnung muss abgefangen werden');
console.log('  ✓ Messezuordnung durchgesetzt: Fehlende Standzuordnung abgelehnt');

// Verkäuferwechsel darf Messezuordnung des Tablets nicht verändern
const secondSeller = DEMO_SELLERS[1];
const resolvedFairBefore = resolveFairContext(FAIR_CONFIGURATION, 'TABLET-01');
assert.ok(resolvedFairBefore);
const orderSeller1 = buildOrder({ ...validOrderParams, seller: validSeller });
const orderSeller2 = buildOrder({ ...validOrderParams, seller: secondSeller });
const resolvedFairAfter = resolveFairContext(FAIR_CONFIGURATION, 'TABLET-01');
assert.ok(resolvedFairAfter);

assert.equal(orderSeller1.fairId, resolvedFairBefore.fairId);
assert.equal(orderSeller2.fairId, resolvedFairBefore.fairId);
assert.equal(resolvedFairBefore.fairId, resolvedFairAfter.fairId);
assert.equal(orderSeller1.sellerId, 'seller-01');
assert.equal(orderSeller2.sellerId, 'seller-02');
console.log('  ✓ Verkäuferwechsel ändert Messe- und Tabletzuordnung nicht');

// -------------------------------------------------------------
// 5. Tests für historische Preise & Geldbeträge in Rappen
// -------------------------------------------------------------
console.log('\n5. Teste historische Preise, Rappen-Kalkulation & 5-Rappen-Rundung:');

// Rappenberechnung
assert.equal(chfToRappen(34.50), 3450);
assert.equal(rappenToCHF(3450), 34.50);
assert.equal(roundRappen5(2452), 2450);
assert.equal(roundRappen5(2453), 2455);
assert.equal(roundRappen5(2458), 2460);
console.log('  ✓ Interne Rappen-Umrechnung und 5-Rappen-Rundung mathematisch exakt');

// Erstelle Bestellung mit historischem Preis
const mutableWine = { ...winePinot, priceCHF: 34.50 };
const historicOrder = buildOrder({
  items: [{ wine: mutableWine, quantity: 6 }],
  fairContext: validFairContext,
  seller: validSeller,
  customer: validCustomer,
});

assert.equal(historicOrder.items[0].unitPriceCHF, 34.50);
assert.equal(historicOrder.items[0].unitPriceRappen, 3450);

// Nachträgliche Preisänderung des Weins im Katalog
mutableWine.priceCHF = 49.00;

// Gespeicherte Bestellung muss unverändert den alten Preis behalten!
assert.equal(historicOrder.items[0].unitPriceCHF, 34.50, 'Historischer Preis darf sich nach Katalogänderung nicht ändern');
assert.equal(historicOrder.items[0].unitPriceRappen, 3450);
console.log('  ✓ Historische Preise in der Bestellung gesichert (Snapshot-Unveränderlichkeit)');

// -------------------------------------------------------------
// 6. Tests für doppelten Bestellabschluss & echte Idempotenz (Fehler A)
// -------------------------------------------------------------
console.log('\n6. Teste echten Schutz vor doppeltem Bestellabschluss & Idempotenz:');

// Test 6.1: Wiederholter Aufruf mit identischem Idempotency-Key
const idempotencyKey1 = 'idemp-session-test-01';
const orderA = buildOrder({
  ...validOrderParams,
  idempotencyKey: idempotencyKey1,
});

const resSave1 = saveStoredOrder(orderA);
assert.equal(resSave1.success, true);
assert.equal(resSave1.isDuplicate, false);

// Zweiter Aufruf mit derselben Order / demselben Key
const resSave2 = saveStoredOrder(orderA);
assert.equal(resSave2.success, true);
assert.equal(resSave2.isDuplicate, true, 'Wiederholter Aufruf muss als Duplikat erkannt werden');
assert.equal(resSave2.order.id, orderA.id);

// Prüfe, dass die Gesamtanzahl gespeicherter Bestellungen nicht gewachsen ist
const allStoredAfterDup = JSON.parse(globalThis.localStorage.getItem('kaisergarten_demo_orders_v1'));
const countWithKey1 = allStoredAfterDup.filter(o => o.idempotencyKey === idempotencyKey1).length;
assert.equal(countWithKey1, 1, 'Es darf genau 1 Bestellung mit diesem Key existieren');
console.log('  ✓ Wiederholter Aufruf mit identischem Key erzeugt keine zweite Bestellung (isDuplicate: true)');

// Test 6.2: Idempotenz-Konflikt (gleicher Key, aber anderer Bestellinhalt)
const conflictOrderParams = {
  ...validOrderParams,
  customer: {
    ...validCustomer,
    id: 'KND-DIFFERENT',
    lastName: 'AndererKunde',
  },
  idempotencyKey: idempotencyKey1, // Selber Key wie oben!
};
const conflictOrder = buildOrder(conflictOrderParams);

assert.throws(
  () => saveStoredOrder(conflictOrder),
  /Idempotenz-Konflikt/,
  'Muss bei abweichendem Inhalt mit demselben Idempotency-Key einen Konfliktfehler werfen'
);
console.log('  ✓ Idempotenz-Konflikt bei verändertem Inhalt mit selbem Key sicher abgefangen');

// Test 6.3: Deterministische Order-ID-Ableitung
const nowTime = new Date('2026-11-05T14:00:00Z');
const id1 = buildOrder({ ...validOrderParams, idempotencyKey: 'key-abc' }, undefined, nowTime).id;
const id2 = buildOrder({ ...validOrderParams, idempotencyKey: 'key-abc' }, undefined, nowTime).id;
assert.equal(id1, id2, 'Wiederholtes Erzeugen mit selbem Idempotency-Key muss identische Order-ID liefern');
console.log('  ✓ Deterministische Order-ID bei identischem Checkout-Key verifiziert');

// -------------------------------------------------------------
// 7. Tests für Fehlerbehandlung beim Speichern (Fehler B)
// -------------------------------------------------------------
console.log('\n7. Teste Fehlerbehandlung beim Speichern (Warenkorberhalt & kein falscher Erfolg):');

// Simulation eines Fehlers beim Speichern (z.B. QuotaExceededError oder privater Modus)
const originalSetItem = globalThis.localStorage.setItem;
let simulateFailure = true;

globalThis.localStorage.setItem = (key, val) => {
  if (simulateFailure && key === 'kaisergarten_demo_orders_v1') {
    throw new Error('QuotaExceededError: Der Speicher des Browsers ist voll.');
  }
  return originalSetItem.call(globalThis.localStorage, key, val);
};

const failOrderParams = {
  ...validOrderParams,
  idempotencyKey: 'idemp-session-fail-01',
};
const failOrder = buildOrder(failOrderParams);

// Versuch zu speichern bei vollem Speicher
let caughtError = null;
try {
  saveStoredOrder(failOrder);
} catch (e) {
  caughtError = e;
}

assert.ok(caughtError, 'saveStoredOrder muss bei Storage-Fehler eine Exception werfen');
assert.ok(caughtError.message.includes('Speichern'), 'Fehlermeldung muss Speicherproblem klar benennen');

// Prüfe: Bestellung darf NICHT als erfolgreich gespeichert gelten!
const allStoredDuringFail = JSON.parse(globalThis.localStorage.getItem('kaisergarten_demo_orders_v1'));
assert.equal(allStoredDuringFail.some(o => o.id === failOrder.id), false, 'Fehlgeschlagene Bestellung darf nicht im Storage existieren');
console.log('  ✓ Bei Speicherfehler wird kein falscher Erfolg deklariert (Exception wird geworfen)');

// Simulation: Benutzer klickt auf "Erneut versuchen", nachdem Speicher frei ist
simulateFailure = false;
const retryResult = saveStoredOrder(failOrder);
assert.equal(retryResult.success, true);
assert.equal(retryResult.isDuplicate, false);

const allStoredAfterRetry = JSON.parse(globalThis.localStorage.getItem('kaisergarten_demo_orders_v1'));
assert.equal(allStoredAfterRetry.some(o => o.id === failOrder.id), true, 'Bestellung nach Retry erfolgreich gesichert');

// Und ein dritter Klick (z.B. User klickt versehentlich nochmals nach Erfolg) bleibt idempotent:
const thirdClickResult = saveStoredOrder(failOrder);
assert.equal(thirdClickResult.success, true);
assert.equal(thirdClickResult.isDuplicate, true);
console.log('  ✓ Wiederholung des Speicherns nach Fehler funktioniert sauber ohne Duplikate');

// Storage wiederherstellen
globalThis.localStorage.setItem = originalSetItem;

console.log('\n--- ALLE PHASE-2 TESTS ERFOLGREICH BESTANDEN (100%) ---');

// Release regression checks against actual modules.
const rebuiltRetry = buildOrder({ ...validOrderParams, idempotencyKey: idempotencyKey1 }, undefined, new Date('2026-11-06T12:00:00Z'));
assert.equal(saveStoredOrder(rebuiltRetry).isDuplicate, true, 'Rebuild and retry on another day must reuse the saved transaction');
assert.throws(() => saveStoredOrder(buildOrder({ ...validOrderParams, idempotencyKey: idempotencyKey1, notes: 'changed' })), /Idempotenz-Konflikt/);
assert.throws(() => saveStoredOrder(buildOrder({ ...validOrderParams, idempotencyKey: idempotencyKey1, customer: { ...validCustomer, street: 'Changed address' } })), /Idempotenz-Konflikt/);
assert.notEqual(buildOrder({ ...validOrderParams, idempotencyKey: 'Aa' }).id, buildOrder({ ...validOrderParams, idempotencyKey: 'BB' }).id, 'Different keys must not collide via a short hash');
const savedGet = globalThis.localStorage.getItem;
globalThis.localStorage.getItem = () => { throw new Error('Read denied'); };
assert.throws(() => saveStoredOrder(buildOrder({ ...validOrderParams, idempotencyKey: 'read-failure' })), /Bestellspeicher/);
globalThis.localStorage.getItem = savedGet;
globalThis.localStorage.setItem = () => {};
assert.throws(() => saveStoredOrder(buildOrder({ ...validOrderParams, idempotencyKey: 'silent-failure' })), /Speicherverifikation/);
globalThis.localStorage.setItem = originalSetItem;
assert.equal(validateOrderParams({ ...validOrderParams, items: [{ wine: winePinot, quantity: 2.5 }, { wine: wineChardonnay, quantity: 3.5 }] }).isValid, false);
const { INITIAL_DEMO_CUSTOMERS, loadStoredCustomers, saveStoredCustomer } = loadTs('../src/data/mockCustomers.ts');
assert.ok(INITIAL_DEMO_CUSTOMERS.every(c => c.email.endsWith('@example.invalid') && c.phone === ''));
assert.deepEqual(loadStoredCustomers(), INITIAL_DEMO_CUSTOMERS);
assert.throws(() => saveStoredCustomer(validCustomer), /synthetische/);
console.log('Release regressions passed: rebuilt retries, full payload conflicts, key collisions, read/write failures, integer quantities and synthetic-only customers.');
