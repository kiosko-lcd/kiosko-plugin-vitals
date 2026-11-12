/**
 * The vitals column of aimonitor as a widget: CPU temperature, CPU, RAM and
 * disk figures, per-core bars and the disk fill. It reads the shared
 * `system/vitals` source (plugin `system`), so ten widgets about the CPU
 * don't each read /proc.
 */
import { definePlugin, defineWidget, t, type Localized } from '@kiosko/sdk';
import { drawVitals } from './draw.ts';
import { VITALS_SOURCE, anyAlert, type Vitals } from './vitals.ts';

export type { Vitals } from './vitals.ts';

/**
 * Fixed vitals for the gallery. The disk is at 91 % on purpose: the only
 * vital lit, to check at a glance that the column lights up only when
 * something is out of range.
 */
export const DEMO_VITALS: Vitals = {
  cpuTemp: 71,
  cpuUsage: 0.23,
  cores: [0.62, 0.18, 0.41, 0.07, 0.93, 0.12, 0.05, 0.33, 0.28, 0.02, 0.51, 0.09, 0.16, 0.04, 0.71, 0.11],
  load: 0.23,
  mem: { used: 26 * 1024 ** 3, total: 62 * 1024 ** 3 },
  disk: { used: 240 * 1024 ** 3, total: 265 * 1024 ** 3, path: '/data' },
  uptime: 836 * 3600,
};

/** A threshold in %, as every vital but the temperature has. */
const pct = (def: number, label: Localized, help?: Localized) => t.integer({ default: def, min: 0, max: 100, unit: '%', slider: true, label, ...(help ? { help } : {}) });

export const vitalsWidget = defineWidget({
  id: 'vitals',
  name: { en: 'System vitals', es: 'Vitales del sistema' },
  description: {
    en: 'CPU temperature, CPU, RAM and disk in dim ink that only turns amber or red past your thresholds; per-core bars when wide.',
    es: 'Temperatura de CPU, CPU, RAM y disco en tinta apagada que solo se vuelve ámbar o roja al pasar tus umbrales; barras por núcleo si hay ancho.',
  },
  icon: 'cpu',
  category: 'system',
  tags: ['cpu', 'ram', 'disk', 'temperature'],
  size: { min: { w: 200, h: 160 }, preferred: { w: 600, h: 390 } },
  options: t.object({
    cpuWarn: pct(85, { en: 'Amber CPU from', es: 'CPU ámbar desde' }, { en: 'Overall and per core.', es: 'Total y por núcleo.' }),
    cpuAlert: pct(95, { en: 'Red CPU from', es: 'CPU roja desde' }),
    ramWarn: pct(85, { en: 'Amber RAM from', es: 'RAM ámbar desde' }),
    ramAlert: pct(95, { en: 'Red RAM from', es: 'RAM roja desde' }),
    diskWarn: pct(85, { en: 'Amber disk from', es: 'Disco ámbar desde' }),
    diskAlert: pct(95, { en: 'Red disk from', es: 'Disco rojo desde' }),
    tempWarn: t.integer({ default: 85, min: 30, max: 120, unit: '°C', label: { en: 'Amber temperature', es: 'Temperatura ámbar' } }),
    tempAlert: t.integer({ default: 95, min: 30, max: 120, unit: '°C', label: { en: 'Red temperature', es: 'Temperatura roja' } }),
    showCores: t.boolean({ default: true, label: { en: 'Per-core bars', es: 'Barras por núcleo' } }),
    perCoreMinWidth: t.integer({ default: 420, min: 150, max: 2000, unit: 'px', advanced: true, label: { en: 'Per-core bars from this width', es: 'Barras por núcleo a partir de este ancho' } }),
    showDisk: t.boolean({ default: true, label: { en: 'Disk bar', es: 'Barra del disco' } }),
  }),
  sources: [VITALS_SOURCE],
  render(g, ctx) {
    drawVitals(g, ctx, ctx.options);
  },
  // Dim by design: only a vital in the red is worth lighting the panel for.
  idle: ({ sources, options }) => !anyAlert(sources[VITALS_SOURCE] as Vitals | undefined, options),
  demo: () => ({ sources: { [VITALS_SOURCE]: DEMO_VITALS } }),
});

export default definePlugin({
  id: 'vitals',
  name: { en: 'Vitals', es: 'Vitales' },
  version: '0.2.0',
  description: {
    en: 'The machine at a glance, quiet until something runs hot or fills up. Needs the system vitals source.',
    es: 'La máquina de un vistazo, callada hasta que algo se calienta o se llena. Necesita la fuente de vitales del sistema.',
  },
  author: 'Kiosko',
  license: 'MIT',
  icon: 'cpu',
  widgets: [vitalsWidget],
});
