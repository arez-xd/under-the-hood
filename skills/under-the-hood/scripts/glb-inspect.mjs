#!/usr/bin/env node
// Measures a 3D result (GLB, or glTF with embedded data): triangles, vertices, meshes, size in metres, UVs and
// normals, materials and their PBR channels, textures with pixel size and bytes, compression extensions,
// the generator field, and what exceeds a budget. Reads the file only.
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'

const HELP = `Usage: node glb-inspect.mjs <file.glb|file.gltf> [...] [--budget-tris N] [--budget-mb N] [--max-texture PX] [--json] [--extract dir]

  --budget-tris N   flag results over N triangles
  --budget-mb N     flag files over N megabytes
  --max-texture PX  flag textures wider or taller than PX
  --extract dir     write embedded textures to dir (to run media-meta.mjs on them)
  --json            print JSON

Exit code: 0 within budget, 1 over budget or unreadable, 2 usage error.`

const args = process.argv.slice(2)
if (!args.length || args.includes('--help') || args.includes('-h')) { console.log(HELP); process.exit(args.length ? 0 : 2) }
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined }
const budget = { tris: +opt('--budget-tris') || 0, mb: +opt('--budget-mb') || 0, tex: +opt('--max-texture') || 0 }
const extractDir = opt('--extract'), asJson = args.includes('--json')
const files = args.filter((a, i) => !a.startsWith('--') && !['--budget-tris', '--budget-mb', '--max-texture', '--extract'].includes(args[i - 1]))
if (!files.length) { console.error('No file given.\n\n' + HELP); process.exit(2) }

function parse(path) {
  const buf = readFileSync(path)
  let json, bin = null
  if (buf.readUInt32LE(0) === 0x46546c67) { // 'glTF'
    const version = buf.readUInt32LE(4)
    if (version !== 2) throw new Error(`glTF version ${version}; only 2 is supported`)
    let off = 12
    while (off < buf.length) {
      const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4)
      const chunk = buf.subarray(off + 8, off + 8 + len)
      if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8'))
      else if (type === 0x004e4942) bin = chunk
      off += 8 + len
    }
  } else json = JSON.parse(buf.toString('utf8'))
  if (!json) throw new Error('no JSON chunk: not a glTF file')
  return { json, bin, bytes: buf.length }
}

// Bytes of a buffer view: the GLB binary chunk, or an embedded data: URI.
function viewBytes(g, i) {
  const bv = g.json.bufferViews?.[i]
  if (!bv) return null
  const b = g.json.buffers?.[bv.buffer ?? 0]
  let data = null
  if (b?.uri?.startsWith('data:')) data = Buffer.from(b.uri.split(',')[1], 'base64')
  else if (!b?.uri) data = g.bin
  if (!data) return null
  return data.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength)
}

function imageSize(b) {
  if (!b || b.length < 24) return null
  if (b.readUInt32BE(0) === 0x89504e47) return { format: 'png', w: b.readUInt32BE(16), h: b.readUInt32BE(20) }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let o = 2
    while (o < b.length - 9) {
      if (b[o] !== 0xff) { o++; continue }
      const m = b[o + 1]
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { format: 'jpeg', w: b.readUInt16BE(o + 7), h: b.readUInt16BE(o + 5) }
      o += 2 + b.readUInt16BE(o + 2)
    }
    return { format: 'jpeg' }
  }
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16)
    if (kind === 'VP8X') return { format: 'webp', w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) }
    if (kind === 'VP8 ') return { format: 'webp', w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff }
    if (kind === 'VP8L') { const v = b.readUInt32LE(21); return { format: 'webp', w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 } }
    return { format: 'webp' }
  }
  if (b.toString('ascii', 0, 4) === '\xabKTX' || b[0] === 0xab) return { format: 'ktx2' }
  return { format: 'unknown' }
}

function inspect(path) {
  const g = parse(path), j = g.json
  const acc = i => j.accessors?.[i]
  let tris = 0, verts = 0, prims = 0, nonTri = 0
  const attrs = { uv: 0, uv2: 0, normal: 0, tangent: 0, color: 0 }
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  // Count each mesh once per node that uses it (instancing), and size from node-placed positions where simple.
  const uses = new Array(j.meshes?.length || 0).fill(0)
  for (const n of j.nodes || []) if (n.mesh !== undefined) uses[n.mesh]++
  ;(j.meshes || []).forEach((m, mi) => {
    const times = uses[mi] || 1
    for (const p of m.primitives || []) {
      prims++
      const pos = acc(p.attributes?.POSITION)
      const mode = p.mode ?? 4
      const count = p.indices !== undefined ? acc(p.indices)?.count || 0 : pos?.count || 0
      if (mode === 4) tris += Math.floor(count / 3) * times
      else if (mode === 5 || mode === 6) tris += Math.max(0, count - 2) * times
      else nonTri++
      verts += (pos?.count || 0) * times
      if (pos?.min && pos?.max) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], pos.min[k]); max[k] = Math.max(max[k], pos.max[k]) }
      if (p.attributes?.TEXCOORD_0 !== undefined) attrs.uv++
      if (p.attributes?.TEXCOORD_1 !== undefined) attrs.uv2++
      if (p.attributes?.NORMAL !== undefined) attrs.normal++
      if (p.attributes?.TANGENT !== undefined) attrs.tangent++
      if (p.attributes?.COLOR_0 !== undefined) attrs.color++
    }
  })
  const local = min[0] === Infinity ? null : max.map((v, k) => +(v - min[k]).toFixed(4))
  // World-space box: walk the default scene, apply each node's matrix or TRS to the corners of its primitives.
  const mul = (a, b) => { const r = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let rr = 0; rr < 4; rr++) for (let k = 0; k < 4; k++) r[c * 4 + rr] += a[k * 4 + rr] * b[c * 4 + k]; return r }
  const trs = n => {
    if (n.matrix) return n.matrix
    const [x, y, z, w] = n.rotation || [0, 0, 0, 1], [sx, sy, sz] = n.scale || [1, 1, 1], [tx, ty, tz] = n.translation || [0, 0, 0]
    return [(1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0,
      2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
      2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0, tx, ty, tz, 1]
  }
  const wmin = [Infinity, Infinity, Infinity], wmax = [-Infinity, -Infinity, -Infinity]
  const visit = (ni, parent, depth) => {
    const n = j.nodes?.[ni]; if (!n || depth > 64) return
    const m = mul(parent, trs(n))
    if (n.mesh !== undefined) for (const p of j.meshes?.[n.mesh]?.primitives || []) {
      const pos = acc(p.attributes?.POSITION); if (!pos?.min || !pos?.max) continue
      for (let c = 0; c < 8; c++) {
        const v = [c & 1 ? pos.max[0] : pos.min[0], c & 2 ? pos.max[1] : pos.min[1], c & 4 ? pos.max[2] : pos.min[2]]
        for (let k = 0; k < 3; k++) { const t = m[k] * v[0] + m[4 + k] * v[1] + m[8 + k] * v[2] + m[12 + k]; wmin[k] = Math.min(wmin[k], t); wmax[k] = Math.max(wmax[k], t) }
      }
    }
    for (const c of n.children || []) visit(c, m, depth + 1)
  }
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  const scene = j.scenes?.[j.scene ?? 0]
  for (const ni of scene?.nodes || []) visit(ni, I, 0)
  const size = wmin[0] === Infinity ? local : wmax.map((v, k) => +(v - wmin[k]).toFixed(4))

  const textures = (j.images || []).map((im, i) => {
    const b = im.bufferView !== undefined ? viewBytes(g, im.bufferView) : im.uri?.startsWith('data:') ? Buffer.from(im.uri.split(',')[1], 'base64') : null
    const s = imageSize(b) || {}
    if (extractDir && b) {
      mkdirSync(extractDir, { recursive: true })
      writeFileSync(join(extractDir, `${basename(path).replace(/\.\w+$/, '')}-image${i}.${s.format === 'jpeg' ? 'jpg' : s.format || 'bin'}`), b)
    }
    return { index: i, name: im.name || '', mime: im.mimeType || (im.uri && !im.uri.startsWith('data:') ? `external: ${im.uri}` : ''), format: s.format, width: s.w, height: s.h, kb: b ? Math.round(b.length / 1024) : null }
  })
  const used = (ti) => { const t = j.textures?.[ti?.index]; return t ? (t.source ?? t.extensions?.KHR_texture_basisu?.source ?? t.extensions?.EXT_texture_webp?.source) : undefined }
  const materials = (j.materials || []).map(m => {
    const pbr = m.pbrMetallicRoughness || {}
    return {
      name: m.name || '', baseColor: used(pbr.baseColorTexture) !== undefined ? 'texture' : pbr.baseColorFactor ? 'factor' : 'default',
      metallicRoughness: used(pbr.metallicRoughnessTexture) !== undefined ? 'texture' : 'factor',
      normal: m.normalTexture ? 'texture' : '—', occlusion: m.occlusionTexture ? 'texture' : '—', emissive: m.emissiveTexture ? 'texture' : m.emissiveFactor?.some(v => v > 0) ? 'factor' : '—',
      alpha: m.alphaMode || 'OPAQUE', doubleSided: !!m.doubleSided, extensions: Object.keys(m.extensions || {}),
    }
  })

  const over = []
  const mb = g.bytes / 1048576
  if (budget.tris && tris > budget.tris) over.push(`${tris.toLocaleString('en')} triangles > ${budget.tris.toLocaleString('en')}`)
  if (budget.mb && mb > budget.mb) over.push(`${mb.toFixed(1)} MB > ${budget.mb} MB`)
  if (budget.tex) for (const t of textures) if ((t.width || 0) > budget.tex || (t.height || 0) > budget.tex) over.push(`image ${t.index} ${t.width}×${t.height} > ${budget.tex}`)
  const notes = []
  if (!attrs.uv && textures.length) notes.push('textures but no UVs on any primitive')
  if (!attrs.uv && !textures.length && attrs.color) notes.push('vertex colours only: no UVs, no textures')
  if (attrs.normal < prims) notes.push(`${prims - attrs.normal} of ${prims} primitives without normals`)
  if (size && Math.max(...size) > 100) notes.push(`largest side ${Math.max(...size)} units: glTF units are metres, check the scale`)
  if (size && Math.max(...size) < 0.005) notes.push(`largest side ${Math.max(...size)} units: under 5 mm, check the scale`)
  if (nonTri) notes.push(`${nonTri} primitives are points or lines`)
  if (materials.some(m => m.baseColor === 'texture' && m.metallicRoughness === 'factor' && m.normal === '—')) notes.push('colour texture only, no roughness or normal map: lighting may be baked into the colour; check in a viewer')

  return {
    file: path, mb: +mb.toFixed(2), generator: j.asset?.generator || '', copyright: j.asset?.copyright || '', extras: j.asset?.extras || null,
    triangles: tris, vertices: verts, meshes: j.meshes?.length || 0, primitives: prims, nodes: j.nodes?.length || 0,
    sizeMetres: size, attributes: attrs, materials, textures,
    animations: j.animations?.length || 0, skins: j.skins?.length || 0,
    extensionsUsed: j.extensionsUsed || [], extensionsRequired: j.extensionsRequired || [],
    overBudget: over, notes,
  }
}

const results = []
let bad = 0
for (const f of files) {
  if (!existsSync(f) || !statSync(f).isFile()) { console.error(`No such file: ${f}`); bad++; continue }
  try { results.push(inspect(f)) } catch (e) { console.error(`${f}: ${e.message}`); bad++ }
}
if (asJson) console.log(JSON.stringify(results, null, 2))
else for (const r of results) {
  console.log(`\n${r.file}  ${r.mb} MB${r.generator ? `  · generator: ${r.generator}` : ''}`)
  console.log(`  ${r.triangles.toLocaleString('en')} triangles, ${r.vertices.toLocaleString('en')} vertices, ${r.meshes} meshes / ${r.primitives} primitives, ${r.nodes} nodes`)
  if (r.sizeMetres) console.log(`  size ${r.sizeMetres.join(' × ')} m (world space; glTF units are metres)`)
  console.log(`  UV ${r.attributes.uv}/${r.primitives}, normals ${r.attributes.normal}/${r.primitives}, vertex colours ${r.attributes.color}/${r.primitives}`)
  for (const m of r.materials) console.log(`  material "${m.name}": base ${m.baseColor}, metal-rough ${m.metallicRoughness}, normal ${m.normal}, AO ${m.occlusion}, emissive ${m.emissive}, ${m.alpha}${m.extensions.length ? ', ' + m.extensions.join(' ') : ''}`)
  for (const t of r.textures) console.log(`  image ${t.index}: ${t.format || '?'} ${t.width ? `${t.width}×${t.height}` : ''} ${t.kb !== null ? t.kb + ' KB' : t.mime}`)
  if (r.extensionsUsed.length) console.log(`  extensions: ${r.extensionsUsed.join(', ')}${r.extensionsRequired.length ? ` (required: ${r.extensionsRequired.join(', ')})` : ''}`)
  if (r.animations || r.skins) console.log(`  animations ${r.animations}, skins ${r.skins}`)
  for (const o of r.overBudget) console.log(`  OVER BUDGET: ${o}`)
  for (const n of r.notes) console.log(`  note: ${n}`)
}
process.exit(bad || results.some(r => r.overBudget.length) ? 1 : 0)
