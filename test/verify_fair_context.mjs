import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Execute the actual TypeScript module in memory, without duplicating its logic.
const source = await readFile(new URL('../src/config/fairContext.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const { FAIR_CONFIGURATION, getDemoFairContext, resolveFairContext } =
  await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

assert.deepEqual(getDemoFairContext(), {
  tabletId: 'TABLET-01', fairId: 'expovina-weinschiffe',
  fairName: 'Expovina Weinschiffe', booth: 'Demo-Stand 01',
});
assert.equal(resolveFairContext(FAIR_CONFIGURATION, 'TABLET-02'), null);
assert.equal(resolveFairContext(FAIR_CONFIGURATION, 'TABLET-03'), null);
assert.equal(resolveFairContext(FAIR_CONFIGURATION, 'TABLET-04'), null);

const multipleFairs = {
  fairs: [...FAIR_CONFIGURATION.fairs, { id: 'second-fair', name: 'Zweite Testmesse', status: 'active' }],
  tablets: {
    ...FAIR_CONFIGURATION.tablets,
    'TABLET-02': { fairId: 'second-fair', booth: 'Stand B' },
    'TABLET-03': { fairId: 'expovina-weinschiffe', booth: 'Stand C' },
  },
};
assert.equal(resolveFairContext(multipleFairs, 'TABLET-01').fairName, 'Expovina Weinschiffe');
assert.equal(resolveFairContext(multipleFairs, 'TABLET-02').fairName, 'Zweite Testmesse');
assert.equal(resolveFairContext(multipleFairs, 'TABLET-03').booth, 'Stand C');
const before = JSON.stringify(multipleFairs);
resolveFairContext(multipleFairs, 'TABLET-02');
assert.equal(JSON.stringify(multipleFairs), before, 'Resolution must not mutate assignments');

for (const status of ['planned', 'closed']) {
  assert.equal(resolveFairContext({
    ...FAIR_CONFIGURATION,
    fairs: [{ ...FAIR_CONFIGURATION.fairs[0], status }],
  }, 'TABLET-01'), null);
}
assert.equal(resolveFairContext({ ...FAIR_CONFIGURATION, fairs: [] }, 'TABLET-01'), null);
assert.equal(resolveFairContext({
  ...FAIR_CONFIGURATION, fairs: [...FAIR_CONFIGURATION.fairs, ...FAIR_CONFIGURATION.fairs],
}, 'TABLET-01'), null);
assert.equal(resolveFairContext({
  ...FAIR_CONFIGURATION,
  tablets: { ...FAIR_CONFIGURATION.tablets, 'TABLET-01': { fairId: 'expovina-weinschiffe', booth: ' ' } },
}, 'TABLET-01'), null);
assert.equal(resolveFairContext({
  ...FAIR_CONFIGURATION,
  fairs: [{ ...FAIR_CONFIGURATION.fairs[0], name: 'Umbenannte Messe' }],
}, 'TABLET-01').fairName, 'Umbenannte Messe');

console.log('Messekontext: Standard, drei Tablets, parallele Messen, Umbenennung und ungültige Zuordnungen erfolgreich geprüft.');
