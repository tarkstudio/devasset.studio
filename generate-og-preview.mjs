import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    crc32.table = table;
  }
  let c = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xff];
  }
  return (c ^ (-1)) >>> 0;
}

function writeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const toCrc = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crcVal = crc32(toCrc);
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

function generateOgImage(width, height) {
  const rowBytes = 1 + width * 4;
  const raw = Buffer.alloc(rowBytes * height);

  // Set pixel helper
  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const offset = y * rowBytes + 1 + x * 4;
    raw[offset] = r;
    raw[offset + 1] = g;
    raw[offset + 2] = b;
    raw[offset + 3] = a;
  }

  function blendPixel(x, y, r, g, b, alphaFloat) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const offset = y * rowBytes + 1 + x * 4;
    const existingR = raw[offset];
    const existingG = raw[offset + 1];
    const existingB = raw[offset + 2];
    const a = Math.min(1, Math.max(0, alphaFloat));
    raw[offset] = Math.round(existingR * (1 - a) + r * a);
    raw[offset + 1] = Math.round(existingG * (1 - a) + g * a);
    raw[offset + 2] = Math.round(existingB * (1 - a) + b * a);
    raw[offset + 3] = 255;
  }

  function fillRect(rx, ry, rw, rh, r, g, b, aFloat = 1) {
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        blendPixel(x, y, r, g, b, aFloat);
      }
    }
  }

  function fillRoundedRect(rx, ry, rw, rh, radius, r, g, b, aFloat = 1) {
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        let inside = true;
        if (x < rx + radius && y < ry + radius) {
          const dx = x - (rx + radius);
          const dy = y - (ry + radius);
          if (dx * dx + dy * dy > radius * radius) inside = false;
        } else if (x > rx + rw - radius && y < ry + radius) {
          const dx = x - (rx + rw - radius);
          const dy = y - (ry + radius);
          if (dx * dx + dy * dy > radius * radius) inside = false;
        } else if (x < rx + radius && y > ry + rh - radius) {
          const dx = x - (rx + radius);
          const dy = y - (ry + rh - radius);
          if (dx * dx + dy * dy > radius * radius) inside = false;
        } else if (x > rx + rw - radius && y > ry + rh - radius) {
          const dx = x - (rx + rw - radius);
          const dy = y - (ry + rh - radius);
          if (dx * dx + dy * dy > radius * radius) inside = false;
        }
        if (inside) {
          blendPixel(x, y, r, g, b, aFloat);
        }
      }
    }
  }

  // 1. Fill base background with dark slate and radial glow
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const glow = Math.max(0, 1 - dist / 700);

      // Base: #0B0F17 (11, 15, 23)
      let r = 11 + Math.round(glow * 25);
      let g = 15 + Math.round(glow * 20);
      let b = 23 + Math.round(glow * 60);

      // Grid line accent every 40px
      if (x % 40 === 0 || y % 40 === 0) {
        r = Math.min(255, r + 5);
        g = Math.min(255, g + 7);
        b = Math.min(255, b + 14);
      }

      setPixel(x, y, r, g, b, 255);
    }
  }

  // 2. Top accent highlight bar
  fillRect(0, 0, width, 5, 99, 102, 241, 1);

  // 3. Central Brand Hero Card
  fillRoundedRect(80, 70, 1040, 490, 24, 21, 28, 40, 0.95);
  // Border for Hero Card
  for (let x = 80; x <= 1120; x++) {
    blendPixel(x, 70, 49, 66, 92, 0.8);
    blendPixel(x, 560, 34, 47, 67, 0.8);
  }
  for (let y = 70; y <= 560; y++) {
    blendPixel(80, y, 49, 66, 92, 0.8);
    blendPixel(1120, y, 34, 47, 67, 0.8);
  }

  // 4. Logo Terminal Icon Box
  fillRoundedRect(130, 120, 80, 80, 18, 99, 102, 241, 1);
  // Inner subtle gradient
  fillRoundedRect(132, 122, 76, 76, 16, 79, 70, 229, 0.5);

  // Terminal symbol "</>" inside logo
  fillRect(150, 158, 12, 4, 255, 255, 255, 1);
  fillRect(150, 154, 4, 12, 255, 255, 255, 1);
  fillRect(178, 158, 12, 4, 255, 255, 255, 1);
  fillRect(186, 154, 4, 12, 255, 255, 255, 1);
  fillRect(166, 146, 8, 28, 255, 255, 255, 1);

  // Verified Badge (top right of hero card)
  fillRoundedRect(920, 120, 140, 36, 18, 16, 185, 129, 0.15);
  for (let x = 920; x <= 1060; x++) {
    blendPixel(x, 120, 16, 185, 129, 0.4);
    blendPixel(x, 156, 16, 185, 129, 0.4);
  }
  for (let y = 120; y <= 156; y++) {
    blendPixel(920, y, 16, 185, 129, 0.4);
    blendPixel(1060, y, 16, 185, 129, 0.4);
  }

  // 5. Four Store Platform Cards (Google Play, Apple iOS, Samsung, Amazon)
  const stores = [
    { title: 'Google Play', sub: '512×512 Icon • 1024×500 Graphic', tag: 'GP', r: 16, g: 185, b: 129 },
    { title: 'Apple iOS', sub: '1024×1024 Master (Zero Alpha)', tag: 'iOS', r: 99, g: 102, b: 241 },
    { title: 'Samsung Galaxy', sub: '512px One UI • Promo Banner', tag: 'GS', r: 59, g: 130, b: 246 },
    { title: 'Amazon Appstore', sub: '512px / 114px • Fire OS Ready', tag: 'AMZ', r: 245, g: 158, b: 11 },
  ];

  const cardW = 226;
  const cardH = 130;
  const startX = 130;
  const startY = 320;
  const gap = 28;

  stores.forEach((st, idx) => {
    const cx = startX + idx * (cardW + gap);
    const cy = startY;

    // Card background
    fillRoundedRect(cx, cy, cardW, cardH, 16, 15, 23, 42, 0.9);
    // Border
    for (let x = cx; x <= cx + cardW; x++) {
      blendPixel(x, cy, st.r, st.g, st.b, 0.4);
      blendPixel(x, cy + cardH, 30, 41, 59, 0.7);
    }
    for (let y = cy; y <= cy + cardH; y++) {
      blendPixel(cx, y, st.r, st.g, st.b, 0.4);
      blendPixel(cx + cardW, y, 30, 41, 59, 0.7);
    }

    // Store Tag Pill
    fillRoundedRect(cx + 16, cy + 16, 44, 28, 8, st.r, st.g, st.b, 0.2);
    // Accent line
    fillRect(cx + 16, cy + 54, cardW - 32, 2, st.r, st.g, st.b, 0.6);
  });

  // 6. Bottom Banner / Guarantees
  fillRoundedRect(130, 476, 940, 56, 12, 11, 15, 23, 0.85);
  // Accent indicator dots (Emerald for 100% In-Browser)
  fillRoundedRect(156, 498, 12, 12, 6, 16, 185, 129, 1);
  fillRoundedRect(480, 498, 12, 12, 6, 99, 102, 241, 1);
  fillRoundedRect(790, 498, 12, 12, 6, 245, 158, 11, 1);

  // Compress IDAT
  const compressed = zlib.deflateSync(raw, { level: 9 });

  // Construct PNG
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdr = writeChunk('IHDR', ihdrData);
  const idat = writeChunk('IDAT', compressed);
  const iend = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const ogBuffer = generateOgImage(1200, 630);

// Ensure target directories exist
const publicAssetsDir = path.join(process.cwd(), 'public', 'assets');
const rootAssetsDir = path.join(process.cwd(), 'assets');

if (!fs.existsSync(publicAssetsDir)) {
  fs.mkdirSync(publicAssetsDir, { recursive: true });
}
if (!fs.existsSync(rootAssetsDir)) {
  fs.mkdirSync(rootAssetsDir, { recursive: true });
}

fs.writeFileSync(path.join(publicAssetsDir, 'og-preview.png'), ogBuffer);
fs.writeFileSync(path.join(rootAssetsDir, 'og-preview.png'), ogBuffer);

console.log('Successfully generated og-preview.png (1200x630, 24-bit RGBA) at:');
console.log(' - ' + path.join(publicAssetsDir, 'og-preview.png'));
console.log(' - ' + path.join(rootAssetsDir, 'og-preview.png'));
console.log('File size: ' + ogBuffer.length + ' bytes');
