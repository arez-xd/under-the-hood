// Shared helpers for the script tests: run a script, build small binary fixtures in a temp folder.
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = join(dirname(fileURLToPath(import.meta.url)), '..')
export const scripts = join(root, 'skills/under-the-hood/scripts')
export const fixtures = join(root, 'tests/fixtures')
export const sampleVideo = join(root, 'examples/blind-test/round-2/target/media/v3/9c21/output.mp4')
export const tmp = () => mkdtempSync(join(tmpdir(), 'uth-test-'))

export function run(script, args = []) {
  const r = spawnSync(process.execPath, [join(scripts, script), ...args], { encoding: 'utf8' })
  return { code: r.status, out: r.stdout, err: r.stderr }
}
export const json = (script, args) => { const r = run(script, [...args, '--json']); return { ...r, data: JSON.parse(r.out) } }

// CRC-32 for PNG chunks.
const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
const crc32 = buf => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]), crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
// CBOR text string: 0x60 + length up to 23 bytes, 0x78 + one length byte above.
const text = s => { const b = Buffer.from(s, 'latin1'); return Buffer.concat([Buffer.from(b.length < 24 ? [0x60 + b.length] : [0x78, b.length]), b]) }

// A 1×1 PNG whose caBX chunk carries the parts of a C2PA manifest media-meta reads: the claim generator,
// actions with descriptions, an ingredient, the IPTC source type and a signer organisation.
export function c2paPng(dir) {
  const ihdr = Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0])
  const manifest = Buffer.concat([
    Buffer.from('jumdc2pa c2pa.assertions c2pa.ingredient.v3 ', 'latin1'),
    text('action'), text('c2pa.created'), text('description'), text('Created by a test model for the media-meta test.'),
    text('digitalSourceType'), text('http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia'),
    text('claim_generator_info'), Buffer.from([0x81, 0xa2]), text('name'), text('Test Generator'),
    Buffer.from([0x55, 0x04, 0x0a, 0x0c, 11]), Buffer.from('Example Org', 'latin1'),
  ])
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('caBX', manifest), chunk('IEND', Buffer.alloc(0))])
  const file = join(dir, 'signed.png'); writeFileSync(file, png); return file
}

// A GLB with one triangle (0,0,0), (1,0,0), (0,1,0) on a node scaled by 2 and moved by (5, 0, 0).
export function triangleGlb(dir) {
  const pos = Buffer.alloc(36); [0, 0, 0, 1, 0, 0, 0, 1, 0].forEach((v, i) => pos.writeFloatLE(v, i * 4))
  const gltf = {
    asset: { version: '2.0', generator: 'uth-test' }, scene: 0, scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, scale: [2, 2, 2], translation: [5, 0, 0] }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0] }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }], buffers: [{ byteLength: 36 }],
  }
  let js = Buffer.from(JSON.stringify(gltf)); js = Buffer.concat([js, Buffer.alloc((4 - js.length % 4) % 4, 0x20)])
  const head = Buffer.alloc(12), jh = Buffer.alloc(8), bh = Buffer.alloc(8)
  jh.writeUInt32LE(js.length, 0); jh.writeUInt32LE(0x4e4f534a, 4); bh.writeUInt32LE(pos.length, 0); bh.writeUInt32LE(0x004e4942, 4)
  head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + pos.length, 8)
  const file = join(dir, 'triangle.glb'); writeFileSync(file, Buffer.concat([head, jh, js, bh, pos])); return file
}
