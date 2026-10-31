#!/usr/bin/env node
// Reads what an image or video says about where it came from: pixel size, duration, EXIF and XMP fields,
// PNG text chunks (some generators write the prompt and settings there), C2PA content credentials, the
// IPTC "trained algorithmic media" source type, and known generator or encoder names in the metadata.
// Invisible watermarks (such as SynthID) can't be read this way; their absence here proves nothing.
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs'
import { join, extname } from 'node:path'

const HELP = `Usage: node media-meta.mjs <file|folder> [...] [--json]

Formats: PNG, JPEG, WebP, MP4/MOV. Folders are read one level deep.
Exit code: 0 done, 1 a file could not be read, 2 usage error.`

const args = process.argv.slice(2)
if (!args.length || args.includes('--help') || args.includes('-h')) { console.log(HELP); process.exit(args.length ? 0 : 2) }
const asJson = args.includes('--json')
const inputs = args.filter(a => !a.startsWith('--'))
const EXT = /\.(png|jpe?g|webp|mp4|mov|m4v)$/i
const files = []
for (const p of inputs) {
  if (!existsSync(p)) { console.error(`No such file: ${p}`); continue }
  if (statSync(p).isDirectory()) for (const f of readdirSync(p)) { if (EXT.test(f)) files.push(join(p, f)) }
  else files.push(p)
}
if (!files.length) { console.error('No image or video files found.'); process.exit(inputs.length ? 1 : 2) }

const GENERATORS = /midjourney|dall[·\-\s]?e|openai|chatgpt|gpt-image|sora|adobe firefly|firefly|stable diffusion|stability|comfyui|automatic1111|invokeai|fooocus|novelai|leonardo|ideogram|flux|black forest labs|imagen|gemini|google ai|veo|runway|kling|luma|pika|hailuo|minimax|seedance|seedream|bytedance|meshy|tripo|krea|recraft|canva|bing image creator|designer/gi
const ENCODERS = /lavf[0-9.]*|lavc[0-9.]*|ffmpeg|handbrake|isom|mp42|qt  |apple|core media/gi

const ascii = b => b.toString('latin1')
// A CBOR text string at position i: 0x60+n for n ≤ 23, or 0x78 followed by a length byte.
const cborText = (s, i) => {
  const h = s.charCodeAt(i)
  if (h >= 0x61 && h <= 0x77) return s.substr(i + 1, h - 0x60)
  if (h === 0x78) return s.substr(i + 2, s.charCodeAt(i + 1))
  return ''
}
const findAll = (s, re) => [...new Set((s.match(re) || []).map(x => x.trim().toLowerCase()))]

function xmpFields(x) {
  const pick = k => { const m = new RegExp(`${k}[="'>\\s]+([^"'<]{1,120})`, 'i').exec(x); return m ? m[1].trim() : undefined }
  return {
    creatorTool: pick('xmp:CreatorTool'), digitalSourceType: (x.match(/digitalsourcetype[^"'>]*["'>]\s*([^"'<\s]+)/i) || [])[1],
    softwareAgent: pick('stEvt:softwareAgent'), credit: pick('photoshop:Credit'), creator: pick('dc:creator'),
  }
}

// EXIF IFD0 ASCII tags: Make 0x010f, Model 0x0110, Software 0x0131, Artist 0x013b, ImageDescription 0x010e, Copyright 0x8298.
function exifTags(b) {
  const out = {}
  try {
    let o = b.indexOf('Exif\0\0') >= 0 ? b.indexOf('Exif\0\0') + 6 : 0
    const le = b.toString('ascii', o, o + 2) === 'II'
    const u16 = i => le ? b.readUInt16LE(i) : b.readUInt16BE(i), u32 = i => le ? b.readUInt32LE(i) : b.readUInt32BE(i)
    const ifd = o + u32(o + 4), n = u16(ifd)
    const NAMES = { 0x010e: 'description', 0x010f: 'make', 0x0110: 'model', 0x0131: 'software', 0x013b: 'artist', 0x8298: 'copyright' }
    for (let i = 0; i < n && i < 64; i++) {
      const e = ifd + 2 + i * 12, tag = u16(e), type = u16(e + 2), count = u32(e + 4)
      if (!NAMES[tag] || type !== 2) continue
      const at = count <= 4 ? e + 8 : o + u32(e + 8)
      out[NAMES[tag]] = b.toString('latin1', at, at + Math.min(count, 200)).replace(/\0+$/, '').trim()
    }
  } catch {}
  return out
}

function png(b) {
  const r = { format: 'png', width: b.readUInt32BE(16), height: b.readUInt32BE(20), text: {}, c2pa: false }
  let o = 8
  while (o + 8 <= b.length) {
    const len = b.readUInt32BE(o), type = b.toString('ascii', o + 4, o + 8), data = b.subarray(o + 8, o + 8 + len)
    if (type === 'tEXt' || type === 'iTXt' || type === 'zTXt') {
      const z = data.indexOf(0), key = data.toString('latin1', 0, z)
      let val = type === 'tEXt' ? data.toString('latin1', z + 1) : data.toString('utf8', z + 1).replace(/^[\0-\x1f]+/, '')
      if (key === 'XML:com.adobe.xmp') r.xmp = xmpFields(val)
      else r.text[key] = val.slice(0, 300)
    }
    if (type === 'eXIf') r.exif = exifTags(data)
    if (type === 'caBX') { r.c2pa = true; r.c2paRaw = (r.c2paRaw || '') + ascii(data.subarray(0, 60000)) }
    if (type === 'IEND') break
    o += 12 + len
  }
  return r
}

function jpeg(b) {
  const r = { format: 'jpeg', c2pa: false }
  let o = 2
  while (o + 4 < b.length && b[o] === 0xff) {
    const m = b[o + 1], len = b.readUInt16BE(o + 2), seg = b.subarray(o + 4, o + 2 + len)
    if (m === 0xe1 && ascii(seg.subarray(0, 6)) === 'Exif\0\0') r.exif = exifTags(seg)
    if (m === 0xe1 && ascii(seg.subarray(0, 28)).startsWith('http://ns.adobe.com/xap/1.0/')) r.xmp = xmpFields(seg.toString('utf8'))
    if (m === 0xeb && /jumb|c2pa/.test(ascii(seg))) { r.c2pa = true; r.c2paRaw = (r.c2paRaw || '') + ascii(seg.subarray(0, 60000)) }
    if (m === 0xfe) r.comment = seg.toString('latin1').slice(0, 300)
    if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) { r.height = b.readUInt16BE(o + 5); r.width = b.readUInt16BE(o + 7) }
    if (m === 0xda) break
    o += 2 + len
  }
  return r
}

function webp(b) {
  const r = { format: 'webp', c2pa: false }
  let o = 12
  while (o + 8 <= b.length) {
    const type = b.toString('ascii', o, o + 4), len = b.readUInt32LE(o + 4), data = b.subarray(o + 8, o + 8 + len)
    if (type === 'VP8X') { r.width = 1 + data.readUIntLE(4, 3); r.height = 1 + data.readUIntLE(7, 3) }
    if (type === 'VP8 ' && !r.width) { r.width = data.readUInt16LE(6) & 0x3fff; r.height = data.readUInt16LE(8) & 0x3fff }
    if (type === 'VP8L' && !r.width) { const v = data.readUInt32LE(1); r.width = (v & 0x3fff) + 1; r.height = ((v >> 14) & 0x3fff) + 1 }
    if (type === 'EXIF') r.exif = exifTags(data)
    if (type === 'XMP ') r.xmp = xmpFields(data.toString('utf8'))
    if (type === 'C2PA') { r.c2pa = true; r.c2paRaw = ascii(data.subarray(0, 60000)) }
    o += 8 + len + (len & 1)
  }
  return r
}

function mp4(b) {
  const r = { format: 'mp4/mov', c2pa: false, tracks: [] }
  const walk = (start, end, depth) => {
    let o = start
    while (o + 8 <= end && depth < 8) {
      let size = b.readUInt32BE(o); const type = b.toString('latin1', o + 4, o + 8)
      let head = 8
      if (size === 1) { size = Number(b.readBigUInt64BE(o + 8)); head = 16 }
      if (size === 0) size = end - o
      if (size < head) break
      const body = o + head
      if (type === 'ftyp') r.brand = b.toString('latin1', body, body + 4).trim()
      if (type === 'mvhd') { const v = b[body]; const ts = v ? b.readUInt32BE(body + 20) : b.readUInt32BE(body + 12); const du = v ? Number(b.readBigUInt64BE(body + 24)) : b.readUInt32BE(body + 16); if (ts) r.durationSec = +(du / ts).toFixed(2) }
      if (type === 'tkhd') { const v = b[body]; const off = body + (v ? 84 : 72) + 4; const w = Math.round(b.readUInt32BE(off) / 65536), h = Math.round(b.readUInt32BE(off + 4) / 65536); if (w && h) r.tracks.push(`${w}×${h}`) }
      if (type === 'uuid' && /c2pa|jumb/.test(b.toString('latin1', body, Math.min(body + 64, o + size)))) { r.c2pa = true; r.c2paRaw = (r.c2paRaw || '') + b.toString('latin1', body, Math.min(o + size, body + 200000)) }
      // The video sample entry holds the coded size, the one the encoder produced (the track header holds the display size).
      if (type === 'stsd' && /^(avc1|avc3|hvc1|hev1|av01|vp09|mp4v)$/.test(b.toString('latin1', body + 12, body + 16)) && !r.coded && body + 44 <= b.length) r.coded = `${b.readUInt16BE(body + 40)}×${b.readUInt16BE(body + 42)}`
      if (['moov', 'trak', 'mdia', 'minf', 'stbl', 'udta', 'meta', 'ilst'].includes(type)) walk(type === 'meta' ? body + 4 : body, o + size, depth + 1)
      o += size
    }
  }
  walk(0, b.length, 0)
  const tail = ascii(b.subarray(0, Math.min(b.length, 2e6))) + ascii(b.subarray(Math.max(0, b.length - 2e6)))
  r.encoders = findAll(tail, ENCODERS).slice(0, 6)
  if (/c2pa/.test(tail)) r.c2pa = true
  const size = r.coded || r.tracks[0]
  r.width = size?.split('×')[0]; r.height = size?.split('×')[1]
  delete r.coded
  return r
}

const results = []
let bad = 0
for (const f of files) {
  try {
    const b = readFileSync(f)
    let r
    if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) r = png(b)
    else if (b[0] === 0xff && b[1] === 0xd8) r = jpeg(b)
    else if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') r = webp(b)
    else if (b.toString('latin1', 4, 8) === 'ftyp') r = mp4(b)
    else throw new Error(`unsupported format (${extname(f) || 'no extension'})`)
    const meta = JSON.stringify([r.exif, r.xmp, r.text, r.comment].filter(Boolean))
    const raw = ascii(b.subarray(0, Math.min(b.length, 4e6)))
    r.aiSourceType = /trainedAlgorithmicMedia|compositeWithTrainedAlgorithmicMedia/i.test(raw) || /trainedAlgorithmicMedia/i.test(meta)
    r.generatorNames = findAll(meta + (r.c2paRaw || ''), GENERATORS)
    // The manifest is CBOR: claim_generator_info → { name: <text> }, where a short text string is 0x60 + length.
    const raw2 = r.c2paRaw || ''
    // A text string up to 23 bytes is 0x60 + length; longer ones are 0x78 followed by a length byte.
    const cg = /claim_generator_info[\s\S]{0,8}?name(?:([\x61-\x77])|\x78([\s\S]))/.exec(raw2)
    if (cg) r.c2paClaimGenerator = cg[1] ? raw2.substr(cg.index + cg[0].length, cg[1].charCodeAt(0) - 0x60) : raw2.substr(cg.index + cg[0].length, cg[2].charCodeAt(0))
    else { const old = /claim_generator(?!_info)[\s\S]{0,2}([\x61-\x77])/.exec(raw2); if (old) r.c2paClaimGenerator = raw2.substr(old.index + old[0].length, old[1].charCodeAt(0) - 0x60) }
    // Signer certificates: organizationName (OID 2.5.4.10) as a UTF8 or printable string.
    const orgs = new Set()
    for (const m of raw2.matchAll(/\x55\x04\x0a[\x0c\x13]([\s\S])/g)) orgs.add(raw2.substr(m.index + 5, m[1].charCodeAt(0)))
    if (orgs.size) r.c2paSigners = [...orgs].slice(0, 4)
    // Actions (c2pa.created, c2pa.edited, vendor-specific ones) with their descriptions, and whether the
    // manifest lists an ingredient: a file the result was made from (an edit or image-to-video input).
    const acts = []
    for (const m of raw2.matchAll(/\x66action(?=[\x61-\x78])/g)) {
      const name = cborText(raw2, m.index + m[0].length)
      if (!name) continue
      const next = raw2.indexOf('\x66action', m.index + 7)
      const near = raw2.slice(m.index, Math.min(m.index + 400, next < 0 ? Infinity : next))
      const d = near.indexOf('\x6bdescription')
      const desc = d >= 0 ? cborText(near, d + 12) : ''
      acts.push(desc ? `${name} ("${desc}")` : name)
    }
    if (acts.length) r.c2paActions = [...new Set(acts)].slice(0, 6)
    if (raw2) r.c2paIngredient = /c2pa\.ingredient/.test(raw2)
    delete r.c2paRaw
    if (r.text?.parameters || r.text?.prompt || r.text?.workflow) r.promptInMetadata = Object.keys(r.text).filter(k => /parameters|prompt|workflow/i.test(k))
    results.push({ file: f, kb: Math.round(b.length / 1024), ...r })
  } catch (e) { console.error(`${f}: ${e.message}`); bad++ }
}

if (asJson) console.log(JSON.stringify(results, null, 2))
else for (const r of results) {
  console.log(`\n${r.file}  ${r.format}  ${r.width ? `${r.width}×${r.height}` : ''}${r.durationSec ? `  ${r.durationSec} s` : ''}  ${r.kb} KB`)
  console.log(`  C2PA content credentials: ${r.c2pa ? `present${r.c2paClaimGenerator ? `, claim generator "${r.c2paClaimGenerator}"` : ''}${r.c2paSigners ? `, certificates from ${r.c2paSigners.map(x => `"${x}"`).join(', ')}` : ''}` : 'none found'}; IPTC AI source type: ${r.aiSourceType ? 'trainedAlgorithmicMedia' : 'none'}`)
  if (r.c2paActions) console.log(`  C2PA actions: ${r.c2paActions.join('; ')}`)
  if (r.c2pa && r.c2paIngredient !== undefined) console.log(`  C2PA ingredient: ${r.c2paIngredient ? 'yes, made from an input file (an edit, or an image or video given as input)' : 'none listed'}`)
  if (r.exif && Object.keys(r.exif).length) console.log(`  EXIF: ${Object.entries(r.exif).map(([k, v]) => `${k}=${v}`).join('; ')}`)
  if (r.xmp) console.log(`  XMP: ${Object.entries(r.xmp).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join('; ') || 'present, no tool fields'}`)
  if (r.text && Object.keys(r.text).length) console.log(`  PNG text: ${Object.keys(r.text).join(', ')}${r.promptInMetadata ? ' (prompt or workflow stored in the file)' : ''}`)
  if (r.brand) console.log(`  container brand: ${r.brand}; tracks ${r.tracks.join(', ') || '—'}; encoder strings: ${r.encoders.join(', ') || '—'}`)
  console.log(`  generator names in metadata: ${r.generatorNames.join(', ') || 'none'}`)
}
console.log(asJson ? '' : '\nNo metadata is not evidence of anything: services often strip it, and re-encoding (trimming, joining, compressing) removes it. Invisible watermarks are not read by this script. Content credentials name the company that signed and the tool that last saved the file: they do not tell models of one company apart, and a file passed through another tool carries that tool\'s claim.')
process.exit(bad ? 1 : 0)
