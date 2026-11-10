import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEMO_VITALS } from './index.ts';
import { anyAlert, diskRatio, gigabytes, pairOf, statsOf, tempLevel, vitalLevel, type VitalThresholds } from './vitals.ts';
import plugin from './index.ts';

const T: VitalThresholds = { cpuWarn: 85, cpuAlert: 95, ramWarn: 85, ramAlert: 95, diskWarn: 85, diskAlert: 95, tempWarn: 85, tempAlert: 95 };

test('levels: normal is dim, only past the thresholds it lights', () => {
  const ram = pairOf(T, 'ram');
  assert.equal(vitalLevel(0.65, ram), 'normal', 'RAM at 65 % is any Tuesday');
  assert.equal(vitalLevel(0.9, ram), 'warn');
  assert.equal(vitalLevel(0.95, ram), 'alert');
  assert.equal(tempLevel(71, T), 'normal');
  assert.equal(tempLevel(88, T), 'warn');
  assert.equal(tempLevel(99, T), 'alert');
});

test('stats: only what could be read, in a fixed order', () => {
  assert.deepEqual(statsOf(DEMO_VITALS, T).map((s) => [s.key, s.value, s.level]), [
    ['temp', '71°', 'normal'],
    ['cpu', '23%', 'normal'],
    ['ram', '42%', 'normal'],
    ['disk', '91%', 'warn'],
  ]);
  assert.deepEqual(statsOf({ mem: { used: 1, total: 4 } }, T).map((s) => s.key), ['ram']);
  assert.deepEqual(statsOf({ mem: { used: 1, total: 0 } }, T)[0]?.value, '0%', 'a zero total never divides by zero');
});

test('each vital has its own pair: a disk at 91 % can be normal', () => {
  const lax = { ...T, diskWarn: 92, diskAlert: 98 };
  assert.equal(statsOf(DEMO_VITALS, lax).find((s) => s.key === 'disk')!.level, 'normal');
  assert.equal(statsOf({ cpuUsage: 0.91 }, lax)[0]!.level, 'warn', 'the CPU keeps its own');
  assert.equal(statsOf({ mem: { used: 70, total: 100 } }, { ...T, ramWarn: 60, ramAlert: 70 })[0]!.level, 'alert');
});

test('options: integer % thresholds, show… switches', () => {
  const props = (plugin.widgets![0]!.options as { props: Record<string, { default: unknown; unit?: string; max?: number }> }).props;
  for (const k of ['cpuWarn', 'cpuAlert', 'ramWarn', 'ramAlert', 'diskWarn', 'diskAlert']) {
    assert.equal(props[k]!.unit, '%', k);
    assert.equal(props[k]!.max, 100, k);
  }
  assert.deepEqual(Object.keys(props).filter((k) => !/Warn$|Alert$/.test(k)), ['showCores', 'perCoreMinWidth', 'showDisk']);
});

test('idle unless something is in the red; cores do not count', () => {
  assert.equal(anyAlert(DEMO_VITALS, T), false);
  assert.equal(anyAlert(undefined, T), false);
  assert.equal(anyAlert({ cpuTemp: 97 }, T), true);
  assert.equal(anyAlert({ cores: [1, 1, 1] }, T), false);
});

test('disk helpers', () => {
  assert.ok(Math.abs(diskRatio(DEMO_VITALS)! - 240 / 265) < 1e-9);
  assert.equal(diskRatio({}), null);
  assert.equal(gigabytes(265 * 1024 ** 3), '265GB');
});
