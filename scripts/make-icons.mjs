// Generates the PWA / home-screen icons as real PNGs, with no image
// dependencies — a dusk gradient with a soft crescent. Run: npm run icons
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'public', 'icons')

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(width, height, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // truecolour with alpha
  const raw = Buffer.alloc((width * 4 + 1) * height)
  let p = 0
  for (let y = 0; y < height; y++) {
    raw[p++] = 0 // no filter
    rgba.copy(raw, p, y * width * 4, (y + 1) * width * 4)
    p += width * 4
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/**
 * A small vintage travel-poster: gauloise blue ground, a bright yellow sun,
 * and a cream horizon band. Flat colour, hard edges, no gradients — the way
 * two-colour printing would have done it.
 */
const BLUE = [23, 49, 143]
const YELLOW = [255, 198, 41]
const CREAM = [245, 240, 227]
const INK = [16, 27, 59]

function render(size) {
  const buf = Buffer.alloc(size * size * 4)
  const sun = { x: size * 0.5, y: size * 0.42, r: size * 0.2 }
  const horizon = size * 0.68
  const band = size * 0.055

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let color = BLUE

      // Sun, then the cream horizon over the lower half.
      if (Math.hypot(x - sun.x, y - sun.y) <= sun.r) color = YELLOW
      if (y >= horizon) color = y < horizon + band ? CREAM : INK
      // A single cream rule under the sun, poster-style.
      if (y >= horizon - band * 1.6 && y < horizon - band * 0.6) color = CREAM

      const i = (y * size + x) * 4
      buf[i] = color[0]
      buf[i + 1] = color[1]
      buf[i + 2] = color[2]
      buf[i + 3] = 255
    }
  }
  return png(size, size, buf)
}

mkdirSync(outDir, { recursive: true })
for (const size of [180, 192, 512]) {
  const file = join(outDir, `icon-${size}.png`)
  writeFileSync(file, render(size))
  console.log(`wrote ${file}`)
}
