// Builds a clean SVG outline of Saudi Arabia (ISO 682) from Natural Earth (world-atlas 50m).
import {readFileSync, writeFileSync} from 'node:fs';
import {feature} from 'topojson-client';
import {geoMercator, geoPath} from 'd3-geo';
const topo = JSON.parse(readFileSync(new URL('../node_modules/world-atlas/countries-50m.json', import.meta.url)));
const all = feature(topo, topo.objects.countries);
const sa = all.features.find((f) => String(f.id) === '682');
const W = 1000, H = 1000;
const proj = geoMercator().fitExtent([[20, 20], [W - 20, H - 20]], sa);
const path = geoPath(proj);
const [[x0, y0], [x1, y1]] = path.bounds(sa);
writeFileSync(new URL('../src/lib/saudi-map.json', import.meta.url), JSON.stringify({d: path(sa), w: W, h: H, bounds: [x0, y0, x1, y1], riyadh: proj([46.7219, 24.6877]), jeddah: proj([39.1925, 21.4858]), dammam: proj([50.1033, 26.4207])}));
console.log('✓ saudi map', Math.round(x1 - x0), 'x', Math.round(y1 - y0));
