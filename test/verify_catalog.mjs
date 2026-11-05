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
const { DEMO_PRICE_CONFIGURATION } = loadTs('src/config/demoPrices.ts');
assert.equal(DEMO_PRICE_CONFIGURATION.enabled, false, 'Demo pricing must remain inactive without approval');
assert.deepEqual(DEMO_PRICE_CONFIGURATION.entries, [], 'No example prices may enter the catalog implicitly');
assert.equal(CATALOG.length, Object.values(snapshot.pages).reduce((a, b) => a + b, 0));
assert.equal(CATALOG.length, 67, 'Reviewed source snapshot has 67 articles; review count when refreshing');
assert.equal(new Set(CATALOG.map(p => p.id)).size, CATALOG.length);
assert.equal(new Set(CATALOG.map(p => p.sourceUrl)).size, CATALOG.length);
const categories = {};
for (const p of CATALOG) {
  categories[p.category] = (categories[p.category] ?? 0) + 1;
  assert.equal(new URL(p.sourceUrl).hostname, 'kaisergarten-weine.ch');
  assert.equal(p.id, `kg-shop-${p.sourceId}`);
  assert.equal(p.priceCHF, null);
  assert.equal(isOrderableWine(p), false);
  assert.equal(isWineCartonProduct(p), false, 'Unconfirmed packages never count as standard bottles');
  if (p.imageUrl) {
    assert.match(p.imageUrl, /^images\/products\/kg-\d+\.png$/);
    const image = fs.readFileSync(path.join(root, 'public', p.imageUrl));
    assert.equal(image.subarray(1, 4).toString(), 'PNG');
    assert.ok(image.readUInt32BE(16) > 0 && image.readUInt32BE(20) > 0);
  }
  const result = validateOrderParams({ items: [{ wine: p, quantity: 6 }] });
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some(message => message.startsWith('Preis noch nicht hinterlegt')));
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
const priced = { ...CATALOG[0], priceCHF:20, caseSize:6, cartonRule:'standard-6' };
assert.equal(isOrderableWine(priced), true);
for (const priceCHF of [null, 0, -1, NaN, Infinity]) assert.equal(isOrderableWine({ ...priced, priceCHF }), false);
assert.equal(isOrderableWine({ ...priced, cartonRule:'excluded' }), false);
assert.equal(isOrderableWine({ ...priced, caseSize:null }), false);
const sortable = [CATALOG[0], priced, { ...priced, priceCHF:10 }];
assert.deepEqual(filterCatalog(sortable, { ...baseFilter, sortBy:'price-asc' }).map(p => p.priceCHF), [10,20,null]);
assert.deepEqual(filterCatalog(sortable, { ...baseFilter, sortBy:'price-desc' }).map(p => p.priceCHF), [20,10,null]);
assert.deepEqual(restoreCatalogCart([{wine:{id:'retired-demo'},quantity:6},{wine:CATALOG[0],quantity:6}], CATALOG), []);
assert.deepEqual(restoreCatalogCart(null, CATALOG), []);
assert.deepEqual(restoreCatalogCart([null, {}, {wine:priced,quantity:1.5}], [priced]), []);
const restored = restoreCatalogCart([{wine:{...priced,priceCHF:1},quantity:3},{wine:priced,quantity:3}], [priced]);
assert.equal(restored.length, 1);
assert.equal(restored[0].quantity, 6);
assert.equal(restored[0].wine.priceCHF, 20);
assert.equal(CATALOG.find(p => p.sourceId === '1092980').vintage, null);
assert.equal(CATALOG.find(p => p.sourceId === '1092975').country, '');
console.log('Catalog tests passed: 67 IDs, 66 local PNGs, source counts, categories, null-safe search/sorting, price/package guards and stale cart migration.');
