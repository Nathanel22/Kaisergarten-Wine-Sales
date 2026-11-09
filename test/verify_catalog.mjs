import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function loadTs(file) {
  const resolved = path.resolve(root, file.endsWith('.ts') || file.endsWith('.json') ? file : `${file}.ts`);
  if (resolved.endsWith('.json')) return JSON.parse(fs.readFileSync(resolved, 'utf8'));
  const code = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    id => loadTs(path.resolve(path.dirname(resolved), id)), module, module.exports);
  return module.exports;
}
const { CATALOG } = loadTs('src/data/catalog.ts');
const { filterCatalog, isOrderableWine, restoreCatalogCart } = loadTs('src/utils/catalog.ts');
const { validateOrderParams } = loadTs('src/utils/orderProcessing.ts');
const { isWineCartonProduct } = loadTs('src/utils/cartonRule.ts');
const snapshot = loadTs('src/data/products.json');
assert.equal(CATALOG.length, Object.values(snapshot.pages).reduce((a, b) => a + b, 0));
assert.equal(CATALOG.length, 67, 'Reviewed source snapshot has 67 articles; review count when refreshing');
assert.equal(new Set(CATALOG.map(p => p.id)).size, CATALOG.length);
assert.equal(new Set(CATALOG.map(p => p.sourceUrl)).size, CATALOG.length);
const tariffs = loadTs('src/data/expovina2026Prices.json');
const readPriceFixture = name => fs.readFileSync(path.join(root,'test/fixtures',name),'utf8')
  .trim().split(/\r?\n/).slice(1).map(line => line.split(';'));
const approved = readPriceFixture('expovina2026-approved.csv');
const proposed = readPriceFixture('expovina2026-proposed.csv');
const paper = [...approved,...proposed];
assert.equal(approved.length,24);
assert.equal(proposed.length,15);
assert.equal(tariffs.length,39);
assert.equal(new Set(tariffs.map(t => t.shopId)).size,39);
for (const t of tariffs) {
  const row = paper.find(r => Number(r[0]) === t.page && Number(r[1]) === t.row);
  assert.ok(row);
  assert.equal(row[2],t.articleNumber); assert.equal(row[3],t.shopId);
  assert.equal(Math.round(Number(row[4])*100),t.priceRappen);
}

const categories = {};
for (const p of CATALOG) {
  categories[p.category] = (categories[p.category] ?? 0) + 1;
  assert.equal(new URL(p.sourceUrl).hostname, 'kaisergarten-weine.ch');
  assert.equal(p.id, `kg-shop-${p.sourceId}`);
  const official = snapshot.products.find(item => item.id === p.id);
  assert.equal(official.priceCHF, null);
  assert.equal(p.caseSize, official.caseSize);
  assert.equal(p.vintage, official.vintage);
  const tariff = tariffs.find(row => row.shopId === p.sourceId);
  assert.equal(p.bottleSizeCl, tariff?.volumeCl ?? official.bottleSizeCl);
  const standard = official.cartonRule === 'unconfirmed' && p.sourceId !== '1093062';
  assert.equal(p.demoClassification, standard ? 'DEMO_STANDARD' : 'DEMO_SONDERPRODUKT');
  assert.equal(p.priceCHF, tariff ? tariff.priceRappen / 100 : standard ? 25 : null);
  assert.equal(p.priceSource, tariff ? 'MESSEPREIS 2026' : 'DEMO-PREIS');
  assert.equal(isOrderableWine(p), standard);
  assert.equal(isWineCartonProduct(p), standard);
  if (p.imageUrl) {
    assert.match(p.imageUrl, /^images\/products\/kg-\d+\.png$/);
    const image = fs.readFileSync(path.join(root, 'public', p.imageUrl));
    assert.equal(image.subarray(1, 4).toString(), 'PNG');
    assert.ok(image.readUInt32BE(16) > 0 && image.readUInt32BE(20) > 0);
  }
  if (!standard) {
    const result = validateOrderParams({ items: [{ wine: p, quantity: 6 }] });
    assert.ok(result.errors.some(message => message.startsWith('Gebinde und Bestellfreigabe')));
  }
}
assert.deepEqual(categories, { white:22, red:29, rose:4, sparkling:4, dessert:4, spirits:3, special:1 });
assert.deepEqual(CATALOG.filter(p => !p.imageUrl).map(p => p.sourceId), ['1093105']);
const baseFilter = { category:'all', searchQuery:'', sortBy:'featured' };
assert.equal(filterCatalog(CATALOG, { ...baseFilter, searchQuery:'1092973' })[0].bottleSizeCl, 70);
assert.equal(filterCatalog(CATALOG, { ...baseFilter, searchQuery:'mendoza' }).length, 1);
assert.ok(filterCatalog(CATALOG, { ...baseFilter, searchQuery:'  gin armstrong  ' }).some(p => p.sourceId === '1092975'));
assert.equal(filterCatalog(CATALOG, { ...baseFilter, category:'spirits' }).length, 3);
for (const sortBy of ['price-asc','price-desc','vintage-desc','name-asc']) {
  assert.equal(filterCatalog(CATALOG, { ...baseFilter, sortBy }).length, 67);
}
const priced = CATALOG.find(p => isOrderableWine(p) && p.priceSource === 'DEMO-PREIS');
const special = CATALOG.find(p => !isOrderableWine(p) && p.priceCHF == null);
assert.equal(CATALOG.filter(isOrderableWine).length, 55);
for (const priceCHF of [null, 0, -1, 24, NaN, Infinity]) assert.equal(isOrderableWine({ ...priced, priceCHF }), false);
assert.equal(isOrderableWine({ ...special, priceCHF:25 }), false);
const sortable = [special, priced, { ...priced, priceCHF:10 }];
assert.deepEqual(filterCatalog(sortable, { ...baseFilter, sortBy:'price-asc' }).map(p => p.priceCHF), [10,25,null]);
assert.deepEqual(filterCatalog(sortable, { ...baseFilter, sortBy:'price-desc' }).map(p => p.priceCHF), [25,10,null]);
assert.deepEqual(restoreCatalogCart([{wine:{id:'retired-demo'},quantity:6},{wine:special,quantity:6}], CATALOG), []);
assert.deepEqual(restoreCatalogCart(null, CATALOG), []);
assert.deepEqual(restoreCatalogCart([null, {}, {wine:priced,quantity:1.5}], [priced]), []);
const restored = restoreCatalogCart([{wine:{...priced,priceCHF:1},quantity:3},{wine:priced,quantity:3}], [priced]);
assert.equal(restored.length, 1);
assert.equal(restored[0].quantity, 6);
assert.equal(restored[0].wine.priceCHF, 25);
assert.equal(CATALOG.find(p => p.sourceId === '1092980').vintage, null);
assert.equal(CATALOG.find(p => p.sourceId === '1092975').country, '');
console.log('Catalog tests passed: 67 IDs, 66 local PNGs, source counts, categories, null-safe search/sorting, price/package guards and stale cart migration.');

// Exercise the same checkout entry point as the UI. Product assets are outside this boundary.
const { simulateCheckout } = loadTs('src/utils/demoCheckout.ts');
const { resetDemoData, CART_STORAGE_KEY, SELLER_STORAGE_KEY, ORDERS_STORAGE_KEY } = loadTs('src/utils/demoStorage.ts');
const { DEMO_SELLERS } = loadTs('src/config/demoSeller.ts');
const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key,value) => storage.set(key,value),
  removeItem: key => storage.delete(key),
};
let transmissions = 0;
const denyNetwork = () => { transmissions++; throw new Error('Unexpected order transmission'); };
globalThis.fetch = denyNetwork;
globalThis.XMLHttpRequest = class { constructor() { denyNetwork(); } };
globalThis.WebSocket = globalThis.XMLHttpRequest;
Object.defineProperty(navigator, 'sendBeacon', { value: denyNetwork, configurable: true });
const pair = CATALOG.filter(p => isOrderableWine(p) && p.priceSource === 'DEMO-PREIS').slice(0,2);
const lines = pair.map(p => ({ id:p.id, quantity:3 }));
const checkout = (items,key) => simulateCheckout(items,'DEMO-CUSTOMER-1',DEMO_SELLERS[0].id,key);
const first = checkout(lines,'mixed-six');
assert.ok(first.success);
assert.equal(first.order.pricing.finalTotalCHF,150);
assert.equal(first.order.mode,'SIMULATION');
assert.ok(first.order.items.every(i => i.priceSource === 'DEMO-PREIS' && i.unitPriceCHF === 25));
assert.ok(checkout(lines,'mixed-six').isDuplicate);
assert.throws(() => checkout([{id:pair[0].id,quantity:6}], 'mixed-six'), /Idempotenz-Konflikt/);
assert.throws(() => checkout([{id:pair[0].id,quantity:5}], 'invalid'), /Kartonregel/);
assert.throws(() => checkout([{id:special.id,quantity:6}], 'special'), /nicht freigegeben/);
assert.throws(() => simulateCheckout(lines,'unknown',DEMO_SELLERS[0].id,'invalid'), /Beispielkunde/);
const twelve = lines.map(l => ({...l,quantity:6}));
assert.equal(checkout(twelve,'mixed-twelve').order.pricing.finalTotalCHF,300);
const setItem = localStorage.setItem;
localStorage.setItem = () => { throw new Error('quota'); };
assert.throws(() => checkout(lines,'retry'), /Speichern/);
localStorage.setItem = setItem;
assert.equal(checkout(lines,'retry').isDuplicate,false);
assert.equal(checkout(lines,'retry').isDuplicate,true);
assert.equal(JSON.parse(storage.get(ORDERS_STORAGE_KEY)).length,3);
const { saveStoredCustomer, loadStoredCustomers } = loadTs('src/data/mockCustomers.ts');
const draft = {kind:'Privatperson', firstName:'Demo', lastName:'Testperson', company:'', street:'Testgasse', houseNumber:'4b', zip:'8000', city:'Testort', country:'Schweiz', email:'kunde@example.invalid', phone:'', fictional:true};
for (const patch of [{firstName:''},{lastName:''},{street:''},{houseNumber:''},{zip:'ABC'},{city:''},{email:''},{email:'demo@localhost'},{phone:'123456789'},{fictional:false}]) {
  assert.throws(() => saveStoredCustomer({...draft,...patch}));
}
const person = saveStoredCustomer(draft);
const firm = saveStoredCustomer({...draft,kind:'Firma',company:'Testbetrieb',firstName:'',lastName:'',email:'',phone:'00000000',country:'Deutschland',zip:'12345'});
assert.notEqual(firm.id,person.id);
assert.equal(loadStoredCustomers().length,5);
assert.equal(simulateCheckout(lines,person.id,DEMO_SELLERS[0].id,'new-person').order.customer.street,'Testgasse 4b');
assert.equal(simulateCheckout(lines,firm.id,DEMO_SELLERS[0].id,'new-company').order.customer.company,'Testbetrieb');
localStorage.setItem = () => { throw new Error('quota'); };
assert.throws(() => saveStoredCustomer(draft),/nicht gespeichert/);
localStorage.setItem = setItem;
assert.equal(loadStoredCustomers().length,5);
const different = ['1093038', '1093066'].map(id => ({id:'kg-shop-'+id, quantity:3}));
const fair = checkout(different, 'fair-mixed').order;
assert.deepEqual(fair.items.map(i => [i.unitPriceRappen,i.priceSource]), [[2390,'MESSEPREIS 2026'],[3550,'MESSEPREIS 2026']]);
assert.equal(fair.pricing.rawSubtotalRappen,17820);
assert.equal(fair.pricing.finalTotalRappen,17820); // No delivery fee applied
assert.ok(checkout(different,'fair-mixed').isDuplicate);
const hybrid = checkout([different[0],lines[0]],'fair-demo').order;
assert.equal(hybrid.pricing.finalTotalRappen,14670);
assert.deepEqual(hybrid.items.map(i => i.priceSource),['MESSEPREIS 2026','DEMO-PREIS']);
for (const id of ['1093062','1092965','1092973']) assert.throws(() => checkout([{id:'kg-shop-'+id,quantity:6}],id),/nicht freigegeben/);
assert.equal(transmissions,0);
for (const key of [CART_STORAGE_KEY,SELLER_STORAGE_KEY,'unrelated']) storage.set(key,'test');
resetDemoData(localStorage);
assert.deepEqual([...storage.keys()],['unrelated']);
assert.equal(loadStoredCustomers().length,3);
assert.match(fs.readFileSync(path.join(root,'index.html'),'utf8'), /name="robots" content="noindex, nofollow"/);
assert.match(fs.readFileSync(path.join(root,'public/robots.txt'),'utf8'), /Disallow: \/\s*$/);
console.log('Demo simulation passed: mixed 6/12, exact prices, eligible IDs, synthetic customers, zero checkout transmissions, verified retry and scoped reset.');
