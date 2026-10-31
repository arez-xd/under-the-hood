#!/usr/bin/env node
// Is it the model they sell? Compares a service's results with a reference made at the vendor.
//   video: measures MP4/MOV files (resolution, frame rate, duration, frame count, codec, audio, bitrate,
//          encoder strings) and lists where the service's results fall outside the reference's.
//   image: compares pixel sizes and formats of PNG, JPEG and WebP results.
//   llm:   reads timing and score records (JSONL) for the service and vendor arms and says which arm the
//          service is closer to on time to first token, output speed and score.
// Reads files only. Conclusions are "consistent with", never proof.
import { readFileSync, existsSync, statSync } from 'node:fs'
import { basename } from 'node:path'

const HELP = `Usage:
  node fingerprint.mjs video <service files…> --ref <vendor files…> [--json]
  node fingerprint.mjs video <service files…> --profile model-profile.json [--json]
  node fingerprint.mjs image <service files…> --ref <vendor files…> [--json]
  node fingerprint.mjs llm <runs.jsonl> [--service service] [--json]

llm records, one per line: {"arm":"service","task":"t01","ttft_ms":820,"total_ms":14200,"output_chars":2400,"score":1}
Arms other than --service (default "service") are the vendor references, e.g. "opus" and "sonnet".

Exit code: 0 consistent with the reference, 1 mismatches found or bad input, 2 usage error.`

const args = process.argv.slice(2)
if (!args.length || args.includes('--help') || args.includes('-h')) { console.log(HELP); process.exit(args.length ? 0 : 2) }
const mode = args[0], asJson = args.includes('--json')
const after = flag => { const i = args.indexOf(flag); if (i < 0) return []; const out = []; for (let k = i + 1; k < args.length && !args[k].startsWith('--'); k++) out.push(args[k]); return out }
const firstFlag = args.findIndex((a, i) => i > 0 && a.startsWith('--'))
const subject = args.slice(1, firstFlag < 0 ? args.length : firstFlag)
const fail = msg => { console.error(msg); process.exit(1) }
if (!['video', 'image', 'llm'].includes(mode)) { console.error(`Unknown mode "${mode}".\n\n${HELP}`); process.exit(2) }
for (const f of [...subject, ...after('--ref'), ...after('--profile')]) if (!existsSync(f) || !statSync(f).isFile()) fail(`No such file: ${f}`)

// ---------- MP4 / MOV ----------
function mp4(path) {
  const b = readFileSync(path)
  if (b.toString('latin1', 4, 8) !== 'ftyp') throw new Error('not an MP4/MOV file')
  const tracks = []
  let movie = {}
  const walk = (start, end, ctx, depth) => {
    let o = start
    while (o + 8 <= end && depth < 10) {
      let size = b.readUInt32BE(o), head = 8
      const type = b.toString('latin1', o + 4, o + 8)
      if (size === 1) { size = Number(b.readBigUInt64BE(o + 8)); head = 16 }
      if (size === 0) size = end - o
      if (size < head || o + size > end + 8) break
      const p = o + head
      if (type === 'mvhd') { const v = b[p]; const ts = b.readUInt32BE(p + (v ? 20 : 12)); const du = v ? Number(b.readBigUInt64BE(p + 24)) : b.readUInt32BE(p + 16); movie = { timescale: ts, duration: ts ? du / ts : 0 } }
      if (type === 'trak') { const t = {}; tracks.push(t); walk(p, o + size, t, depth + 1) }
      else if (['mdia', 'minf', 'stbl', 'moov', 'edts'].includes(type)) walk(p, o + size, ctx, depth + 1)
      if (ctx) {
        if (type === 'tkhd') { const v = b[p]; const off = p + (v ? 88 : 76); ctx.width = Math.round(b.readUInt32BE(off) / 65536); ctx.height = Math.round(b.readUInt32BE(off + 4) / 65536) }
        if (type === 'mdhd') { const v = b[p]; ctx.timescale = b.readUInt32BE(p + (v ? 20 : 12)); ctx.mdur = v ? Number(b.readBigUInt64BE(p + 24)) : b.readUInt32BE(p + 16) }
        if (type === 'hdlr') ctx.kind = b.toString('latin1', p + 8, p + 12)
        // The sample entry: codec, and for video the coded width and height (what the encoder produced).
        if (type === 'stsd') { ctx.codec = b.toString('latin1', p + 12, p + 16).trim(); if (p + 44 <= b.length) { ctx.codedW = b.readUInt16BE(p + 40); ctx.codedH = b.readUInt16BE(p + 42) } }
        // Sample times: frame count, the media time the frames span, and the frame durations used.
        if (type === 'stts') { const n = b.readUInt32BE(p + 4); let count = 0, span = 0; const deltas = new Map(); for (let i = 0; i < n && i < 4096; i++) { const c = b.readUInt32BE(p + 8 + i * 8), d = b.readUInt32BE(p + 12 + i * 8); count += c; span += c * d; deltas.set(d, (deltas.get(d) || 0) + c) } ctx.samples = count; ctx.span = span; ctx.deltas = deltas }
        if (type === 'stsz') { const fixed = b.readUInt32BE(p + 4), n = b.readUInt32BE(p + 8); let sum = 0; if (fixed) sum = fixed * n; else for (let i = 0; i < n; i++) sum += b.readUInt32BE(p + 12 + i * 4); ctx.bytes = sum }
      }
      o += size
    }
  }
  walk(0, b.length, null, 0)
  const v = tracks.find(t => t.kind === 'vide') || {}
  const a = tracks.find(t => t.kind === 'soun')
  // Duration from the frames themselves; the track header's duration can include padding or an edit.
  const vdur = v.timescale && v.span ? v.span / v.timescale : v.timescale ? v.mdur / v.timescale : movie.duration
  const fps = v.samples && vdur ? v.samples / vdur : null
  // Variable frame rate: more than one frame duration across more than 1% of the frames (a last frame differing is normal).
  const minority = v.deltas ? v.samples - Math.max(...v.deltas.values()) : 0
  const width = v.codedW || v.width, height = v.codedH || v.height
  const text = b.toString('latin1', 0, Math.min(b.length, 1e6)) + b.toString('latin1', Math.max(0, b.length - 1e6))
  return {
    file: basename(path), width, height, resolution: width ? `${width}x${height}` : null,
    display: v.width && (v.width !== width || v.height !== height) ? `${v.width}x${v.height}` : null,
    fps: fps ? +fps.toFixed(2) : null, variableFrameRate: minority > v.samples / 100, duration: +(vdur || 0).toFixed(2), frames: v.samples || null,
    codec: v.codec || null, audio: !!a, audioCodec: a?.codec || null,
    videoKbps: v.bytes && vdur ? Math.round(v.bytes * 8 / vdur / 1000) : null,
    encoders: [...new Set((text.match(/lavf[0-9.]+|lavc[0-9.]+|x264 - core [0-9]+|x265|nvenc|videotoolbox|ffmpeg/gi) || []).map(s => s.toLowerCase()))].slice(0, 5),
  }
}

// ---------- images ----------
function img(path) {
  const b = readFileSync(path)
  if (b.readUInt32BE(0) === 0x89504e47) return { file: basename(path), format: 'png', resolution: `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}` }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let o = 2
    while (o < b.length - 9) { if (b[o] !== 0xff) { o++; continue } const m = b[o + 1]; if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { file: basename(path), format: 'jpeg', resolution: `${b.readUInt16BE(o + 7)}x${b.readUInt16BE(o + 5)}` }; o += 2 + b.readUInt16BE(o + 2) }
  }
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const k = b.toString('ascii', 12, 16)
    if (k === 'VP8X') return { file: basename(path), format: 'webp', resolution: `${1 + b.readUIntLE(24, 3)}x${1 + b.readUIntLE(27, 3)}` }
    if (k === 'VP8 ') return { file: basename(path), format: 'webp', resolution: `${b.readUInt16LE(26) & 0x3fff}x${b.readUInt16LE(28) & 0x3fff}` }
    if (k === 'VP8L') { const v = b.readUInt32LE(21); return { file: basename(path), format: 'webp', resolution: `${(v & 0x3fff) + 1}x${((v >> 14) & 0x3fff) + 1}` } }
  }
  throw new Error('not a PNG, JPEG or WebP file')
}

// ---------- compare sets ----------
const near = (a, b, tol) => Math.abs(a - b) <= tol
function compare(service, ref, keys) {
  const rows = []
  for (const [key, tol] of keys) {
    const allowed = ref[key]
    if (!allowed || !allowed.length) continue
    const seen = [...new Set(service.map(s => s[key]).filter(v => v !== null && v !== undefined))]
    const outside = seen.filter(v => !allowed.some(a => typeof a === 'number' && typeof v === 'number' ? near(a, v, tol) : String(a).toLowerCase() === String(v).toLowerCase()))
    rows.push({ property: key, reference: allowed, service: seen, outside })
  }
  return rows
}
const setOf = (list, key) => [...new Set(list.map(x => x[key]).filter(v => v !== null && v !== undefined))]

function report(title, measured, refMeasured, rows) {
  if (asJson) { console.log(JSON.stringify({ mode, service: measured, reference: refMeasured, comparison: rows }, null, 2)); return }
  console.log(`\n${title}\n`)
  for (const m of measured) console.log(`  service   ${Object.entries(m).filter(([k, v]) => v !== null && k !== 'file' && !(Array.isArray(v) && !v.length)).map(([k, v]) => `${k} ${Array.isArray(v) ? v.join('/') : v}`).join(' · ')}  (${m.file})`)
  for (const m of refMeasured || []) console.log(`  reference ${Object.entries(m).filter(([k, v]) => v !== null && k !== 'file' && !(Array.isArray(v) && !v.length)).map(([k, v]) => `${k} ${Array.isArray(v) ? v.join('/') : v}`).join(' · ')}  (${m.file})`)
  console.log('')
  for (const r of rows) console.log(`  ${r.outside.length ? 'OUTSIDE ' : 'within  '} ${r.property}: service ${r.service.map(v => r.outside.includes(v) ? `${v} (outside)` : v).join(', ') || '—'}; reference ${r.reference.join(', ')}`)
  const bad = rows.filter(r => r.outside.length)
  console.log(`\n${bad.length ? `Not consistent with the reference on ${bad.length} of ${rows.length} properties (${bad.map(r => r.property).join(', ')}). Level: indirect. Ask the service which model and version served these.` : `Consistent with the reference on all ${rows.length} properties compared. A match says the claimed model is possible; it does not prove it.`}`)
}

if (mode === 'video' || mode === 'image') {
  const measure = mode === 'video' ? mp4 : img
  if (!subject.length) fail('No service files given.')
  let measured, refMeasured = null, ref
  try { measured = subject.map(measure) } catch (e) { fail(`Service file: ${e.message}`) }
  const KEYS = mode === 'video' ? [['resolution', 0], ['fps', 0.6], ['duration', 0.6], ['codec', 0], ['audio', 0]] : [['resolution', 0], ['format', 0]]
  if (after('--ref').length) {
    try { refMeasured = after('--ref').map(measure) } catch (e) { fail(`Reference file: ${e.message}`) }
    ref = Object.fromEntries(KEYS.map(([k]) => [k, setOf(refMeasured, k)]))
  } else if (after('--profile').length) {
    let p; try { p = JSON.parse(readFileSync(after('--profile')[0], 'utf8')) } catch (e) { fail(`Profile: ${e.message}`) }
    const s = p[mode] || {}
    ref = { resolution: s.resolutions, fps: s.fps, duration: s.durations, codec: s.codecs, audio: s.audio === undefined || s.audio === null ? undefined : [s.audio], format: s.formats }
    if (!Object.values(ref).some(v => v && v.length)) fail(`The profile has no ${mode} fields filled in.`)
  } else fail('Give --ref <vendor files…> or --profile <model-profile.json>.')
  const rows = compare(measured, ref, KEYS)
  report(`${mode === 'video' ? 'Video' : 'Image'} fingerprint: ${measured.length} service result(s) against ${refMeasured ? `${refMeasured.length} reference result(s)` : 'the model profile'}`, measured, refMeasured, rows)
  process.exit(rows.some(r => r.outside.length) ? 1 : 0)
}

if (mode === 'llm') {
  const file = subject[0]
  if (!file) fail('No JSONL file given.')
  const serviceArm = (after('--service')[0]) || 'service'
  const recs = []
  readFileSync(file, 'utf8').split('\n').forEach((l, i) => { if (!l.trim()) return; try { recs.push(JSON.parse(l)) } catch { fail(`Line ${i + 1} is not JSON.`) } })
  const arms = [...new Set(recs.map(r => r.arm))]
  if (!arms.includes(serviceArm)) fail(`No records for arm "${serviceArm}". Arms found: ${arms.join(', ')}`)
  const refs = arms.filter(a => a !== serviceArm)
  if (!refs.length) fail('No vendor reference arms (e.g. "opus", "sonnet").')
  const median = xs => { const s = xs.filter(Number.isFinite).sort((a, b) => a - b); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
  const mean = xs => { const s = xs.filter(Number.isFinite); return s.length ? s.reduce((a, b) => a + b, 0) / s.length : null }
  const stats = arm => {
    const r = recs.filter(x => x.arm === arm)
    const speed = r.map(x => x.output_chars && x.total_ms && x.ttft_ms !== undefined ? x.output_chars / Math.max(1, (x.total_ms - x.ttft_ms) / 1000) : NaN)
    return { arm, n: r.length, ttft_ms: median(r.map(x => x.ttft_ms)), chars_per_s: median(speed), score: mean(r.map(x => x.score)) }
  }
  const all = [serviceArm, ...refs].map(stats)
  const svc = all[0]
  const verdicts = []
  for (const k of ['ttft_ms', 'chars_per_s', 'score']) {
    if (svc[k] === null) continue
    const cands = all.slice(1).filter(a => a[k] !== null)
    if (!cands.length) continue
    const closest = cands.reduce((best, a) => Math.abs(a[k] - svc[k]) < Math.abs(best[k] - svc[k]) ? a : best)
    const spread = Math.max(...cands.map(a => a[k])) - Math.min(...cands.map(a => a[k]))
    const clear = cands.length > 1 && spread > 0 && Math.abs(closest[k] - svc[k]) < spread / 3
    verdicts.push({ measure: k, service: svc[k], closest: closest.arm, clear })
  }
  if (asJson) { console.log(JSON.stringify({ arms: all, verdicts }, null, 2)); process.exit(0) }
  const f = v => v === null ? '—' : Number.isInteger(v) ? v : v.toFixed(2)
  console.log('\nLanguage model fingerprint\n\n  arm            runs   median TTFT ms   median chars/s   mean score')
  for (const a of all) console.log(`  ${a.arm.padEnd(14)} ${String(a.n).padStart(4)}   ${String(f(a.ttft_ms)).padStart(14)}   ${String(f(a.chars_per_s)).padStart(14)}   ${String(f(a.score)).padStart(10)}`)
  console.log('')
  for (const v of verdicts) console.log(`  ${v.measure}: closest to "${v.closest}"${v.clear ? '' : ' (not clearly separated; more runs or a larger gap needed)'}`)
  const few = all.some(a => a.n < 10)
  console.log(`\n${few ? 'Fewer than 10 runs in some arm: treat as a hint. ' : ''}Network, load and the service's own processing shift timings; read 2x differences as meaningful. Level: indirect.`)
  process.exit(0)
}

console.error(`Unknown mode "${mode}".\n\n${HELP}`)
process.exit(2)
