# tessera-plugin-vitals

The machine at a glance, quiet until something runs hot or fills up. Needs the system vitals source.

A plugin for [Tessera](https://github.com/Loksly/tessera), the widget mosaic for small USB LCD panels.

![System vitals](docs/vitals.png)

## Install

In Tessera, **Plugins → Install from npm** → `tessera-plugin-vitals`, then restart Tessera. Or from a terminal:

```sh
npm install --prefix ~/.config/tessera/plugins tessera-plugin-vitals
```

(macOS: `~/Library/Application Support/Tessera/plugins`, Windows: `%APPDATA%\Tessera\plugins`.)

## Requirements

- The `system/vitals` source from [tessera-plugin-system](../tessera-plugin-system).

## Widgets

### System vitals — `vitals/vitals`

CPU temperature, CPU, RAM and disk in dim ink that only turns amber or red past your thresholds; per-core bars when wide.

![System vitals](docs/vitals.png)

Uses: `system/vitals`.

| Option | Type | Default | |
|---|---|---|---|
| `warn` | number | `0.85` | Amber from (CPU, RAM, disk) |
| `alert` | number | `0.95` | Red from (CPU, RAM, disk) |
| `tempWarn` | number | `85` | Amber temperature |
| `tempAlert` | number | `95` | Red temperature |
| `cores` | boolean | `true` | Per-core bars |
| `perCoreMinWidth` | number | `420` | Per-core bars from this width |
| `disk` | boolean | `true` | Disk bar |

## Development

```sh
npm install
npm test          # node:test
npm run check     # TypeScript
npm run build     # dist/index.js, what Tessera loads
```

To try it in a running Tessera without publishing: `tessera plugins link .` and restart Tessera.

Working on Tessera and its plugins together: clone them side by side
(`tessera/` and `tessera-plugins/tessera-plugin-vitals/`) and run `npm install` in
`tessera/`; its workspaces link every plugin found in `../tessera-plugins`.

## License

MIT
