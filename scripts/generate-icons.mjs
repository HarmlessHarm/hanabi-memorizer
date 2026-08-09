// Dependency-free PNG icon generator.
// Draws the "quiet firework" mark on the night-sky ground (see ux-design.md) and
// writes the PWA / favicon PNGs into ./public. Run: `npm run icons`.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(PUBLIC, { recursive: true });

// suit highlight colors, matching src/lib/suits.ts
const SPOKES = ['#ef6f66', '#f7dd7d', '#47b073', '#5f9be8', '#f2f6f9'];
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

function render(size) {
  const buf = new Uint8Array(size * size * 4);
  const set = (x, y, [r, g, b], a = 1) => {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    const inv = 1 - a;
    buf[i] = r * a + buf[i] * inv;
    buf[i + 1] = g * a + buf[i + 1] * inv;
    buf[i + 2] = b * a + buf[i + 2] * inv;
    buf[i + 3] = 255;
  };
  const disc = (cx, cy, rad, col, a = 1) => {
    for (let y = Math.floor(cy - rad); y <= cy + rad; y++)
      for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= rad) set(x, y, col, a * Math.min(1, (rad - d) * 1.4 + 0.4));
      }
  };

  // night-sky vertical gradient background (full bleed -> maskable safe)
  const top = hex('#1b2029');
  const bot = hex('#0d1014');
  for (let y = 0; y < size; y++) {
    const t = y / size;
    const col = top.map((c, k) => c + (bot[k] - c) * t);
    for (let x = 0; x < size; x++) set(x, y, col);
  }

  // firework burst
  const c = size / 2;
  const inner = size * 0.1;
  const outer = size * 0.36;
  const dot = size * 0.016;
  for (let s = 0; s < 12; s++) {
    const ang = (s * Math.PI * 2) / 12 - Math.PI / 2;
    const col = hex(SPOKES[s % SPOKES.length]);
    const reach = s % 2 ? outer : outer * 0.78;
    const steps = Math.round(reach);
    for (let k = 0; k <= steps; k++) {
      const r = inner + (reach - inner) * (k / steps);
      const x = c + Math.cos(ang) * r;
      const y = c + Math.sin(ang) * r;
      set(x, y, col, 0.9);
      disc(x, y, dot * (0.5 + (k / steps) * 0.9), col, 0.9);
    }
  }
  disc(c, c, size * 0.05, hex('#f4f7fb'), 1);
  return buf;
}

// ---- minimal PNG encoder (RGBA, 8-bit, no interlace) ----
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return (bytes) => {
    let c = 0xffffffff;
    for (const b of bytes) c = t[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
})();

function chunk(type, data) {
  const tb = new TextEncoder().encode(type);
  const body = new Uint8Array(tb.length + data.length);
  body.set(tb, 0);
  body.set(data, tb.length);
  const len = new Uint8Array(4);
  new DataView(len.buffer).setUint32(0, data.length);
  const crc = new Uint8Array(4);
  new DataView(crc.buffer).setUint32(0, CRC(body));
  return Uint8Array.from([...len, ...body, ...crc]);
}

function encodePNG(size, rgba) {
  const sig = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, size);
  dv.setUint32(4, size);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // rest zero (compression, filter, interlace)
  const raw = new Uint8Array(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    raw.set(rgba.subarray(y * size * 4, (y + 1) * size * 4), y * (size * 4 + 1) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Uint8Array.from([
    ...sig,
    ...chunk('IHDR', ihdr),
    ...chunk('IDAT', idat),
    ...chunk('IEND', new Uint8Array(0)),
  ]);
}

for (const [name, size] of [
  ['pwa-192.png', 192],
  ['pwa-512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  writeFileSync(join(PUBLIC, name), encodePNG(size, render(size)));
  console.log('wrote', name);
}

// crisp SVG favicon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#0d1014"/>
  ${Array.from({ length: 12 })
    .map((_, i) => {
      const a = (i * Math.PI * 2) / 12 - Math.PI / 2;
      const col = SPOKES[i % SPOKES.length];
      const r = i % 2 ? 40 : 32;
      return `<line x1="${50 + Math.cos(a) * 12}" y1="${50 + Math.sin(a) * 12}" x2="${
        50 + Math.cos(a) * r
      }" y2="${50 + Math.sin(a) * r}" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`;
    })
    .join('\n  ')}
  <circle cx="50" cy="50" r="6" fill="#f4f7fb"/>
</svg>`;
writeFileSync(join(PUBLIC, 'favicon.svg'), svg);
console.log('wrote favicon.svg');
