/* Genereert de briefpapier-afbeeldingen (merkband, golffiguur, logo-blokje)
   als PNG en schrijft ze base64-gecodeerd naar src/brandassets.js.
   Bron: het huisstijl-ontwerp "Briefpapier v2" (Claude Design-handoff).
   Draaien: node scripts/gen-brand-assets.mjs  (alleen nodig als het ontwerp wijzigt) */

import { deflateSync } from "zlib";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "brandassets.js");

// ---- kleuren uit het ontwerp ----
const NAVY = [0x1f, 0x38, 0x64];
const GREEN = [0x15, 0x7f, 0x5b];
const WAVE1 = [0xf2, 0xf5, 0xfa]; // navy-50
const WAVE2 = [0xe6, 0xeb, 0xf4]; // navy-100

// ---------- minimale PNG-encoder (RGBA, geen dependencies) ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- tekenhulpen op een RGBA-canvas ----------
function canvas(w, h) { return { w, h, px: Buffer.alloc(w * h * 4) }; }
function put(c, x, y, [r, g, b], a = 1) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const i = (y * c.w + x) * 4;
  const da = c.px[i + 3] / 255;
  const oa = a + da * (1 - a);
  if (oa <= 0) return;
  c.px[i]     = Math.round((r * a + c.px[i]     * da * (1 - a)) / oa);
  c.px[i + 1] = Math.round((g * a + c.px[i + 1] * da * (1 - a)) / oa);
  c.px[i + 2] = Math.round((b * a + c.px[i + 2] * da * (1 - a)) / oa);
  c.px[i + 3] = Math.round(oa * 255);
}
function fillRect(c, x0, y0, x1, y1, col, a = 1) {
  for (let y = Math.max(0, y0); y < Math.min(c.h, y1); y++)
    for (let x = Math.max(0, x0); x < Math.min(c.w, x1); x++) put(c, x, y, col, a);
}

// Cubic-bezierketen → y per x-kolom (curves zijn monotoon in x).
function bezierProfile(segs, scale, width) {
  const ys = new Float64Array(width).fill(NaN);
  for (const [p0, c1, c2, p3] of segs) {
    for (let i = 0; i <= 4000; i++) {
      const t = i / 4000, u = 1 - t;
      const x = u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0];
      const y = u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1];
      const xi = Math.min(width - 1, Math.max(0, Math.round(x * scale)));
      ys[xi] = y * scale;
    }
  }
  // gaatjes opvullen
  let last = ys[0];
  for (let x = 0; x < width; x++) { if (Number.isNaN(ys[x])) ys[x] = last; else last = ys[x]; }
  return ys;
}
function fillBelow(c, ys, col) {
  for (let x = 0; x < c.w; x++)
    for (let y = Math.max(0, Math.ceil(ys[x])); y < c.h; y++) put(c, x, y, col, 1);
}
function strokeProfile(c, ys, col, halfW, alpha) {
  for (let x = 0; x < c.w; x++) {
    const yc = ys[x];
    for (let y = Math.floor(yc - halfW - 1); y <= Math.ceil(yc + halfW + 1); y++) {
      const d = Math.abs(y - yc);
      if (d <= halfW) put(c, x, y, col, alpha);
      else if (d <= halfW + 1) put(c, x, y, col, alpha * (halfW + 1 - d));
    }
  }
}
// Afstand punt → lijnsegment (voor de icoon-strokes met ronde uiteinden).
function segDist(px, py, [x0, y0, x1, y1]) {
  const dx = x1 - x0, dy = y1 - y0;
  const t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy));
}

// ---------- 1. merkband: navy strip met groen accent-segment ----------
// ontwerp: hoogte 3.2mm; groen segment van 22mm tot 60mm
function makeBand() {
  const s = 8, W = 210 * s, H = Math.round(3.2 * s);
  const c = canvas(W, H);
  fillRect(c, 0, 0, W, H, NAVY);
  fillRect(c, 22 * s, 0, 60 * s, H, GREEN);
  return encodePng(W, H, c.px);
}

// ---------- 2. golffiguur onderaan (52mm hoog) ----------
function makeDeco() {
  const s = 8, W = 210 * s, H = 52 * s;
  const c = canvas(W, H);
  const segA = [
    [[0, 30], [40, 16], [80, 38], [120, 28]],
    [[120, 28], [155, 19], [185, 30], [210, 22]],
  ];
  const segB = [
    [[0, 42], [45, 30], [95, 48], [140, 38]],
    [[140, 38], [170, 31], [192, 40], [210, 35]],
  ];
  const ysA = bezierProfile(segA, s, W);
  const ysB = bezierProfile(segB, s, W);
  fillBelow(c, ysA, WAVE1);
  fillBelow(c, ysB, WAVE2);
  strokeProfile(c, ysA, GREEN, 0.25 * s, 0.55); // 0.5mm lijn, opacity .55
  return encodePng(W, H, c.px);
}

// ---------- 3. logo-blokje: navy afgerond vierkant + wit documenticoon ----------
function makeMark() {
  const u = 8, S = 24 * u;            // 24-units viewBox → 192px
  const r = (2.8 / 12) * S;           // hoekradius 2.8mm op 12mm
  const c = canvas(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const cx = Math.max(r - x, x - (S - 1 - r), 0);
    const cy = Math.max(r - y, y - (S - 1 - r), 0);
    if (cx === 0 || cy === 0 || Math.hypot(cx, cy) <= r) put(c, x, y, NAVY, 1);
  }
  // documenticoon (zelfde paths als het site-icoon), gestrooktekend
  const P = (x, y) => [x * u, y * u];
  const segs = [];
  const poly = (pts) => { for (let i = 0; i < pts.length - 1; i++) segs.push([...pts[i], ...pts[i + 1]]); };
  poly([P(14, 3), P(7, 3), P(5.6, 3.6), P(5, 5), P(5, 19), P(5.6, 20.4), P(7, 21),
        P(17, 21), P(18.4, 20.4), P(19, 19), P(19, 8), P(14, 3)]);
  poly([P(14, 3), P(14, 8), P(19, 8)]);
  poly([P(9, 13), P(15, 13)]);
  poly([P(9, 17), P(15, 17)]);
  const hw = (1.9 * u) / 2;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let d = Infinity;
    for (const sgm of segs) d = Math.min(d, segDist(x + 0.5, y + 0.5, sgm));
    if (d <= hw) put(c, x, y, [255, 255, 255], 1);
    else if (d <= hw + 1) put(c, x, y, [255, 255, 255], hw + 1 - d);
  }
  return encodePng(S, S, c.px);
}

const band = makeBand(), deco = makeDeco(), mark = makeMark();
const js = `/* GEGENEREERD BESTAND — niet met de hand bewerken.
   Bron: scripts/gen-brand-assets.mjs (huisstijl-ontwerp Briefpapier v2). */

export const BAND_PNG = "${band.toString("base64")}";
export const DECO_PNG = "${deco.toString("base64")}";
export const MARK_PNG = "${mark.toString("base64")}";

// base64 → Uint8Array, werkt in browser én Node.
export function pngBytes(b64) {
  if (typeof atob === "function") {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, "base64"));
}
`;
writeFileSync(OUT, js);
console.log(`Geschreven: ${OUT} (band ${band.length}b, deco ${deco.length}b, mark ${mark.length}b)`);
