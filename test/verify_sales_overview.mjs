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

process.env.TZ = "Europe/Zurich";
const { buildDemoScenario, initializeDemoScenario, initializeDemoScenarioOnce, removeDemoScenario, SCENARIO_SEEN_KEY } = loadTs('src/features/sales-overview/demoScenario.ts');
const { mapOverviewOrders } = loadTs('src/features/sales-overview/orderAdapter.ts');
const { computeOverview, filterOrders, periodStart, formatChf } = loadTs('src/features/sales-overview/salesStats.ts');
const { DEMO_SELLERS } = loadTs('src/config/demoSeller.ts');
const { ORDERS_STORAGE_KEY } = loadTs('src/utils/demoStorage.ts');
const { simulateCheckout } = loadTs('src/utils/demoCheckout.ts');
const { CATALOG } = loadTs('src/data/catalog.ts');
const now = new Date(2026,10,11,12);
const storage = new Map();
globalThis.localStorage = {
 getItem: key => storage.get(key) ?? null,
 setItem: (key,value) => storage.set(key,value),
 removeItem: key => storage.delete(key),
};
let transmissions = 0;
const deny = () => { transmissions++; throw Error('External transmission forbidden'); };
globalThis.fetch = deny;
globalThis.XMLHttpRequest = class { constructor() { deny(); } };
globalThis.WebSocket = globalThis.XMLHttpRequest;
Object.defineProperty(navigator,'sendBeacon',{value:deny,configurable:true});
const seed = initializeDemoScenario(now);
assert.equal(seed.length,6);
assert.ok(seed.every(o => o.mode==='SIMULATION' && o.demoScenario==='sales-overview-v1' && o.notes.includes('Synthetisch')));
assert.ok(seed.every(o => o.items.every(i => i.priceSource==='DEMO-PREIS')));
const mapped = mapOverviewOrders(seed);
assert.ok(mapped.every(o => !('customer' in o) && !('notes' in o) && !('sellerRole' in o)));
const stats = computeOverview(mapped,DEMO_SELLERS);
assert.deepEqual([stats.orders,stats.bottles,stats.sellersWithOrders,stats.sellerCount],[6,48,3,4]);
assert.equal(stats.revenueRappen,120000);
assert.equal(stats.revenueRappen,seed.reduce((n,o)=>n+o.pricing.finalTotalRappen,0));
for(const [id,n,b] of [['seller-01',2,24],['seller-02',1,6],['seller-03',0,0],['seller-04',3,18]]) {
 const s=stats.sellers.find(s=>s.sellerId===id);assert.deepEqual([s.orders,s.bottles],[n,b]);
 assert.equal(s.revenueRappen,s.orderList.reduce((n,o)=>n+o.totalRappen,0));
}
assert.deepEqual(stats.sellers.map(s=>s.revenueRappen),[60000,45000,15000,0]);
assert.deepEqual(initializeDemoScenario(new Date(2027,0,1)),seed,'retry must retain original dates and snapshots');
for(const period of ['today','week','month','fair']) assert.equal(filterOrders(mapped,{fairId:'expovina-weinschiffe',period,now}).length,6);
const at=(date,extra={})=>({...mapped[0],id:date,createdAt:new Date(date).toISOString(),...extra});
const dated=[at('2026-11-11T09:00:00'),at('2026-11-09T00:00:00'),at('2026-11-08T23:59:00'),at('2026-11-01T00:00:00'),at('2026-10-31T23:59:00'),at('2026-11-10T10:00:00',{fairId:'other'}),at('2026-11-12T10:00:00'),at('2026-11-11T10:00:00',{cancelled:true})];
for(const [period,count] of [['today',1],['week',2],['month',4],['fair',5]]) assert.equal(filterOrders(dated,{fairId:'expovina-weinschiffe',period,now}).length,count);
assert.equal(filterOrders(dated,{fairId:'all',period:'fair',now}).length,6);
assert.equal(filterOrders(dated,{fairId:'other',period:'fair',now}).length,1);
assert.equal(filterOrders(mapped,{fairId:'all',period:'today',now:new Date(2026,10,12)}).length,0);
assert.deepEqual(periodStart('week',now),new Date(2026,10,9));
assert.deepEqual(periodStart('week',new Date(2026,10,15)),new Date(2026,10,9));
assert.equal(formatChf(123450),'CHF 1’234.50');assert.equal(formatChf(5),'CHF 0.05');
assert.throws(()=>mapOverviewOrders([...seed,seed[0]]),/Doppelte/);
assert.throws(()=>mapOverviewOrders([{...seed[0],pricing:{}}]),/Snapshot/);
const discounted={...seed[0],pricing:{...seed[0].pricing,finalTotalRappen:12345}};
assert.equal(computeOverview(mapOverviewOrders([discounted]),DEMO_SELLERS).revenueRappen,12345,'saved discounts/rounding must be retained');
const product=CATALOG.find(p=>p.id===seed[0].items[0].wineId);
const oldPrice=product.priceCHF;product.priceCHF=999;
assert.equal(computeOverview(mapOverviewOrders(seed),DEMO_SELLERS).revenueRappen,120000,'never reprice saved orders');product.priceCHF=oldPrice;
const result=simulateCheckout([{id:product.id,quantity:6}],'DEMO-CUSTOMER-1','seller-03','overview-extra');
assert.ok(result.success);
const after=computeOverview(mapOverviewOrders(JSON.parse(storage.get(ORDERS_STORAGE_KEY))),DEMO_SELLERS);
assert.deepEqual([after.orders,after.bottles,after.sellersWithOrders],[7,54,4]);
assert.equal(after.revenueRappen,135000);
assert.ok(simulateCheckout([{id:product.id,quantity:6}],'DEMO-CUSTOMER-1','seller-03','overview-extra').isDuplicate);
assert.equal(initializeDemoScenario(now).length,7);
const remaining=removeDemoScenario();assert.deepEqual(remaining,[result.order]);
assert.deepEqual(removeDemoScenario(),remaining);assert.deepEqual(initializeDemoScenario(now),remaining,'existing test orders are never overwritten');
assert.equal(transmissions,0);
const set=localStorage.setItem;
storage.delete(ORDERS_STORAGE_KEY);
localStorage.setItem=()=>{throw Error('quota');};
assert.throws(()=>initializeDemoScenario(now),/quota/);assert.equal(storage.get(ORDERS_STORAGE_KEY),undefined);
localStorage.setItem=()=>{};assert.throws(()=>initializeDemoScenario(now),/nicht bestätigt/);
localStorage.setItem=set;initializeDemoScenario(now);
localStorage.setItem=()=>{throw Error('quota');};assert.throws(()=>removeDemoScenario(),/quota/);assert.equal(JSON.parse(storage.get(ORDERS_STORAGE_KEY)).length,6);
localStorage.setItem=set;removeDemoScenario();assert.equal(initializeDemoScenario(now).length,6);
storage.set(ORDERS_STORAGE_KEY,'{invalid');assert.throws(()=>initializeDemoScenario(now),/sicher gelesen/);assert.equal(storage.get(ORDERS_STORAGE_KEY),'{invalid');
assert.equal(buildDemoScenario(new Date(2026,10,11,0,1)).length,6);
console.log('Sales overview passed: 4 sellers, 6/48/CHF1200, snapshots, filters, details, 7/54/CHF1350, no duplicate seed, isolated reset, storage failures and zero transmissions.');

// First-open lifecycle: no silent restoration after removal, even after global reset.
storage.clear();
assert.equal(initializeDemoScenarioOnce(now).length,6);
assert.equal(initializeDemoScenarioOnce(now).length,6);
removeDemoScenario();
assert.equal(initializeDemoScenarioOnce(now).length,0);
const { resetDemoData } = loadTs('src/utils/demoStorage.ts');
resetDemoData(localStorage);
assert.equal(storage.get(SCENARIO_SEEN_KEY),'seen');
assert.equal(initializeDemoScenarioOnce(now).length,0);
storage.clear();storage.set(ORDERS_STORAGE_KEY,JSON.stringify([result.order]));
assert.deepEqual(initializeDemoScenarioOnce(now),[result.order]);
assert.equal(storage.get(SCENARIO_SEEN_KEY),'seen');
// Swiss dates must not depend on a travel tablet's system timezone.
process.env.TZ = 'America/New_York';
for (const [iso,expected] of [
 ['2026-11-09T00:15:00Z','2026-11-08T23:00:00.000Z'],
 ['2026-03-29T12:00:00Z','2026-03-28T23:00:00.000Z'],
 ['2026-10-25T12:00:00Z','2026-10-24T22:00:00.000Z'],
 ['2026-07-08T23:30:00Z','2026-07-08T22:00:00.000Z'],
]) assert.equal(periodStart('today',new Date(iso)).toISOString(),expected);
assert.equal(periodStart('week',new Date('2026-03-29T12:00:00Z')).toISOString(),'2026-03-22T23:00:00.000Z');
assert.equal(periodStart('month',new Date('2026-11-01T00:15:00Z')).toISOString(),'2026-10-31T23:00:00.000Z');
assert.equal(filterOrders([at('2026-10-28T12:00:00Z')],{fairId:'all',period:'fair',now}).length,1);
console.log('First-open lifecycle, persistent removal and Swiss DST/timezone tests passed.');
