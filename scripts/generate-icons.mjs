import { deflateSync } from "zlib";
import { writeFileSync } from "fs";

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
}

function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const d = Buffer.from(data);
  return Buffer.concat([u32(d.length), t, d, u32(crc32(Buffer.concat([t, d])))]);
}

function createPNG(size, draw) {
  const px = new Uint8Array(size * size * 4);
  draw(px, size);

  const stride = 1 + size * 4;
  const raw = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x++) {
      const s = (y * size + x) * 4;
      const d = y * stride + 1 + x * 4;
      raw[d] = px[s];
      raw[d + 1] = px[s + 1];
      raw[d + 2] = px[s + 2];
      raw[d + 3] = px[s + 3];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function setPixel(px, size, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= size || y < 0 || y >= size) return;
  const i = (y * size + x) * 4;
  px[i] = r;
  px[i + 1] = g;
  px[i + 2] = b;
  px[i + 3] = a;
}

function fillRoundRect(px, size, x, y, w, h, rx, r, g, b, a = 255) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      let inside = true;
      if (dx < rx && dy < rx) inside = Math.hypot(dx - rx, dy - rx) <= rx;
      else if (dx >= w - rx && dy < rx) inside = Math.hypot(dx - (w - rx - 1), dy - rx) <= rx;
      else if (dx < rx && dy >= h - rx) inside = Math.hypot(dx - rx, dy - (h - rx - 1)) <= rx;
      else if (dx >= w - rx && dy >= h - rx)
        inside = Math.hypot(dx - (w - rx - 1), dy - (h - rx - 1)) <= rx;
      if (inside) setPixel(px, size, x + dx, y + dy, r, g, b, a);
    }
  }
}

function drawIcon(px, size) {
  // Background
  for (let i = 0; i < size * size; i++) {
    const o = i * 4;
    px[o] = 15;
    px[o + 1] = 23;
    px[o + 2] = 42;
    px[o + 3] = 255;
  }

  const pad = Math.round(size * 0.14);
  const gap = Math.round(size * 0.055);
  const cell = Math.round((size - 2 * pad - gap) / 2);
  const rx = Math.round(cell * 0.18);

  const cells = [
    [pad, pad, 99, 102, 241, 255],
    [pad + cell + gap, pad, 129, 140, 248, 180],
    [pad, pad + cell + gap, 129, 140, 248, 180],
    [pad + cell + gap, pad + cell + gap, 99, 102, 241, 140],
  ];

  for (const [cx, cy, r, g, b, a] of cells) {
    fillRoundRect(px, size, cx, cy, cell, cell, rx, r, g, b, a);
  }
}

for (const size of [192, 512]) {
  writeFileSync(`public/icon-${size}.png`, createPNG(size, drawIcon));
  console.log(`✓ public/icon-${size}.png`);
}
