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
  name: { en: 'System vitals', es: 'Vitales del sistema', 'zh-Hant': '系統指標', 'zh-Hans': '系统指标' },
  description: {
    en: 'CPU temperature, CPU, RAM and disk in dim ink that only turns amber or red past your thresholds; per-core bars when wide.',
    es: 'Temperatura de CPU, CPU, RAM y disco en tinta apagada que solo se vuelve ámbar o roja al pasar tus umbrales; barras por núcleo si hay ancho.',
    'zh-Hant': 'CPU 溫度、CPU、RAM 與磁碟以暗色顯示，只有超過你設定的門檻才轉為琥珀色或紅色；寬度足夠時顯示各核心長條。',
    'zh-Hans': 'CPU 温度、CPU、RAM 和磁盘以暗色显示，只有超过你设置的阈值才变为琥珀色或红色；宽度足够时显示各核心条形。',
  },
  icon: 'cpu',
  category: 'system',
  tags: ['cpu', 'ram', 'disk', 'temperature'],
  size: { min: { w: 200, h: 160 }, preferred: { w: 600, h: 390 } },
  options: t.object({
    cpuWarn: pct(85, { en: 'Amber CPU from', es: 'CPU ámbar desde', 'zh-Hant': 'CPU 琥珀色門檻', 'zh-Hans': 'CPU 琥珀色阈值' }, { en: 'Overall and per core.', es: 'Total y por núcleo.', 'zh-Hant': '整體與各核心。', 'zh-Hans': '整体和各核心。' }),
    cpuAlert: pct(95, { en: 'Red CPU from', es: 'CPU roja desde', 'zh-Hant': 'CPU 紅色門檻', 'zh-Hans': 'CPU 红色阈值' }),
    ramWarn: pct(85, { en: 'Amber RAM from', es: 'RAM ámbar desde', 'zh-Hant': 'RAM 琥珀色門檻', 'zh-Hans': 'RAM 琥珀色阈值' }),
    ramAlert: pct(95, { en: 'Red RAM from', es: 'RAM roja desde', 'zh-Hant': 'RAM 紅色門檻', 'zh-Hans': 'RAM 红色阈值' }),
    diskWarn: pct(85, { en: 'Amber disk from', es: 'Disco ámbar desde', 'zh-Hant': '磁碟琥珀色門檻', 'zh-Hans': '磁盘琥珀色阈值' }),
    diskAlert: pct(95, { en: 'Red disk from', es: 'Disco rojo desde', 'zh-Hant': '磁碟紅色門檻', 'zh-Hans': '磁盘红色阈值' }),
    tempWarn: t.integer({ default: 85, min: 30, max: 120, unit: '°C', label: { en: 'Amber temperature', es: 'Temperatura ámbar', 'zh-Hant': '溫度琥珀色門檻', 'zh-Hans': '温度琥珀色阈值' } }),
    tempAlert: t.integer({ default: 95, min: 30, max: 120, unit: '°C', label: { en: 'Red temperature', es: 'Temperatura roja', 'zh-Hant': '溫度紅色門檻', 'zh-Hans': '温度红色阈值' } }),
    showCores: t.boolean({ default: true, label: { en: 'Per-core bars', es: 'Barras por núcleo', 'zh-Hant': '各核心長條', 'zh-Hans': '各核心条形' } }),
    perCoreMinWidth: t.integer({ default: 420, min: 150, max: 2000, unit: 'px', advanced: true, label: { en: 'Per-core bars from this width', es: 'Barras por núcleo a partir de este ancho', 'zh-Hant': '寬度達此值時顯示各核心長條', 'zh-Hans': '宽度达到此值时显示各核心条形' } }),
    showDisk: t.boolean({ default: true, label: { en: 'Disk bar', es: 'Barra del disco', 'zh-Hant': '磁碟長條', 'zh-Hans': '磁盘条形' } }),
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
  name: { en: 'Vitals', es: 'Vitales', 'zh-Hant': '機器健康', 'zh-Hans': '机器健康' },
  version: '0.2.1',
  sdk: '^0.2.0',
  requires: ['system/vitals'],
  description: {
    en: 'The machine at a glance, quiet until something runs hot or fills up. Needs the system vitals source.',
    es: 'La máquina de un vistazo, callada hasta que algo se calienta o se llena. Necesita la fuente de vitales del sistema.',
    'zh-Hant': '機器狀態一目瞭然，平時保持安靜，直到有東西過熱或滿載。需要系統指標資料來源。',
    'zh-Hans': '机器状态一目了然，平时保持安静，直到有东西过热或占满。需要系统指标数据源。',
  },
  author: 'Kiosko',
  license: 'MIT',
  icon: 'cpu',
  widgets: [vitalsWidget],
});
