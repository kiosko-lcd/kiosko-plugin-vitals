/**
 * The machine's vitals as the `system/vitals` source hands them over, and
 * the pure decisions about them: which figures to show and when one lights
 * up. Tested without drawing.
 */

/**
 * Data of `system/vitals`. Every field is optional: they come from /proc,
 * /sys and `os`, which differ between systems, and what can't be read is
 * simply not painted.
 */
export interface Vitals {
  /** CPU package temperature, °C. */
  cpuTemp?: number;
  /** Overall CPU use, 0..1. */
  cpuUsage?: number;
  /** Per-core use, 0..1. Missing on the first reading (no delta yet). */
  cores?: number[];
  /** 1-minute load divided by the number of cores (0..1+). */
  load?: number;
  /** Memory in bytes. */
  mem?: { used: number; total: number };
  /** Watched filesystem, in bytes. */
  disk?: { used: number; total: number; path: string };
  /** Seconds since boot. */
  uptime?: number;
}

export const VITALS_SOURCE = 'system/vitals';

export function vitalsOf(sources: Record<string, unknown>): Vitals | undefined {
  const v = sources[VITALS_SOURCE];
  return v && typeof v === 'object' ? (v as Vitals) : undefined;
}

/**
 * Thresholds of their own, higher than the usage ones: RAM at 65 % or a disk
 * at 70 % is any Tuesday, and with the usage thresholds the column would
 * live in amber, competing with the sessions that really claim you. One pair
 * per vital, in % (temperature in °C): a disk at 85 % is normal life, a CPU
 * at 85 % is not.
 */
export interface VitalThresholds {
  /** CPU use, overall and per core, %. */
  cpuWarn: number;
  cpuAlert: number;
  /** Memory in use, %. */
  ramWarn: number;
  ramAlert: number;
  /** Disk fill, %. */
  diskWarn: number;
  diskAlert: number;
  /** CPU temperature, °C. */
  tempWarn: number;
  tempAlert: number;
}

/** The pair of thresholds of one vital. */
export interface Pair {
  warn: number;
  alert: number;
}

export const pairOf = (t: VitalThresholds, key: 'cpu' | 'ram' | 'disk'): Pair => ({ warn: t[`${key}Warn`], alert: t[`${key}Alert`] });

export type Level = 'normal' | 'warn' | 'alert';

/** Level of a ratio (0..1) against a pair of thresholds in %. */
export function vitalLevel(ratio: number, t: Pair): Level {
  const pct = ratio * 100;
  return pct >= t.alert ? 'alert' : pct >= t.warn ? 'warn' : 'normal';
}

export function tempLevel(celsius: number, t: Pick<VitalThresholds, 'tempWarn' | 'tempAlert'>): Level {
  return celsius >= t.tempAlert ? 'alert' : celsius >= t.tempWarn ? 'warn' : 'normal';
}

export interface Stat {
  key: 'temp' | 'cpu' | 'ram' | 'disk';
  value: string;
  level: Level;
}

export function percent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/** Size in whole GB, the unit people think RAM and disks in. */
export function gigabytes(bytes: number): string {
  return `${Math.round(bytes / 1024 ** 3)}GB`;
}

const ratio = (x: { used: number; total: number }) => (x.total > 0 ? x.used / x.total : 0);

/** The big figures, only those that could be read: the row adapts without holes. */
export function statsOf(v: Vitals, t: VitalThresholds): Stat[] {
  const out: Stat[] = [];
  if (typeof v.cpuTemp === 'number') out.push({ key: 'temp', value: `${Math.round(v.cpuTemp)}°`, level: tempLevel(v.cpuTemp, t) });
  if (typeof v.cpuUsage === 'number') out.push({ key: 'cpu', value: percent(v.cpuUsage), level: vitalLevel(v.cpuUsage, pairOf(t, 'cpu')) });
  if (v.mem) out.push({ key: 'ram', value: percent(ratio(v.mem)), level: vitalLevel(ratio(v.mem), pairOf(t, 'ram')) });
  if (v.disk) out.push({ key: 'disk', value: percent(ratio(v.disk)), level: vitalLevel(ratio(v.disk), pairOf(t, 'disk')) });
  return out;
}

/** Something crossed the red line: worth lighting the panel for. Single cores spike all the time and don't count. */
export function anyAlert(v: Vitals | undefined, t: VitalThresholds): boolean {
  return !!v && statsOf(v, t).some((s) => s.level === 'alert');
}

/** Disk fill ratio, or null without disk data. */
export function diskRatio(v: Vitals): number | null {
  return v.disk ? ratio(v.disk) : null;
}
