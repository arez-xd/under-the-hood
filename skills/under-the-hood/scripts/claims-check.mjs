#!/usr/bin/env node
// Checks a run folder before hand-over: every claim has a status, evidence and a date; "works" always has
// evidence; every vendor or model named in the verdict carries a level; no template placeholders are left;
// the test set was written down. Reads the files only.
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const HELP = `Usage: node claims-check.mjs <run folder> [--json]

Reads claims.md, report.md and task.md in the folder.
Exit code: 0 clean, 1 errors, 2 usage error.`

const args = process.argv.slice(2)
if (!args.length || args.includes('--help') || args.includes('-h')) { console.log(HELP); process.exit(args.length ? 0 : 2) }
const dir = args.find(a => !a.startsWith('--'))
if (!dir || !existsSync(dir) || !statSync(dir).isDirectory()) { console.error(`Not a folder: ${dir}`); process.exit(2) }

const findings = []
const add = (file, line, level, message) => findings.push({ file, line, level, message })
const read = f => existsSync(join(dir, f)) ? readFileSync(join(dir, f), 'utf8') : null
// ISO dates, and day.month.year as reports in many languages write them.
const DATE = /\b(20\d{2}-\d{2}-\d{2}|\d{1,2}\.\d{1,2}\.20\d{2})\b/
const STATUS = ['works', 'interface only', 'stub', 'missing', 'contradicted', 'not checked', 'not checkable', 'claimed, not observed']
const PLACEHOLDER = /<[a-z][^<>\n]{0,80}>/i

// claims.md
const claims = read('claims.md')
if (!claims) add('claims.md', 0, 'error', 'missing')
else {
  const lines = claims.split('\n')
  const docDate = (lines.slice(0, 6).join(' ').match(DATE) || [])[0]
  const hi = lines.findIndex(l => /^\s*\|\s*#\s*\|/.test(l))
  if (hi < 0) add('claims.md', 0, 'error', 'no claims table (a header row starting with "| # |")')
  else {
    const cols = lines[hi].split('|').slice(1, -1).map(c => c.trim().toLowerCase())
    const col = n => cols.indexOf(n)
    let rows = 0
    for (let i = hi + 2; i < lines.length && /^\s*\|/.test(lines[i]); i++) {
      const c = lines[i].split('|').slice(1, -1).map(x => x.trim())
      const claim = c[col('claim')] || ''
      if (!claim) { add('claims.md', i + 1, 'warning', 'empty row; delete it or fill it'); continue }
      rows++
      const status = (c[col('status')] || '').toLowerCase()
      const evidence = c[col('evidence')] || ''
      const tag = `#${c[col('#')] || rows} "${claim.slice(0, 50)}"`
      if (!status) add('claims.md', i + 1, 'error', `${tag}: no status`)
      else if (!STATUS.includes(status)) add('claims.md', i + 1, 'error', `${tag}: status "${status}" is not one of: ${STATUS.join(', ')}`)
      if (['works', 'interface only', 'stub', 'missing', 'contradicted', 'claimed, not observed'].includes(status) && !evidence) add('claims.md', i + 1, 'error', `${tag}: "${status}" needs evidence`)
      if (['not checked', 'not checkable'].includes(status) && !evidence) add('claims.md', i + 1, 'error', `${tag}: "${status}" needs the reason in the Evidence cell`)
      if (col('quote') >= 0 && !c[col('quote')]) add('claims.md', i + 1, 'warning', `${tag}: no quote; claims are quoted word for word`)
      if (col('where') >= 0 && !c[col('where')]) add('claims.md', i + 1, 'warning', `${tag}: no source`)
      if (!(c[col('date')] || '').match(DATE) && !docDate) add('claims.md', i + 1, 'error', `${tag}: no date, and no date at the top of the file`)
    }
    if (!rows) add('claims.md', 0, 'error', 'the table has no filled rows')
  }
}

// report.md
const report = read('report.md')
const VENDORS = /\b(openai|gpt-?[0-9o]|anthropic|claude|google|gemini|imagen|veo|fal|replicate|openrouter|together|groq|fireworks|mistral|deepseek|xai|grok|elevenlabs|runway|luma|kling|stability|stable diffusion|sdxl|flux|black forest labs|ideogram|midjourney|meshy|tripo|seedance|seedream|bytedance|minimax|wan|llama|qwen)\b/i
// The level words in English, and in Russian as the author's own reports write them.
const LEVEL = /\((direct|indirect)\b|not established|own model \(direct|\bdirect:|\bindirect:|[(\[](прямо|косвенно)|не установлен/i
if (!report) add('report.md', 0, 'error', 'missing')
else {
  const lines = report.split('\n')
  if (!DATE.test(lines.slice(0, 6).join(' '))) add('report.md', 1, 'error', 'no date at the top')
  // The verdict is the section named so, or the first "##" section (the template puts it first).
  let v0 = lines.findIndex(l => /^##\s+(verdict|вердикт)/i.test(l))
  if (v0 < 0) v0 = lines.findIndex(l => /^##\s/.test(l))
  if (v0 < 0) add('report.md', 0, 'error', 'no "## Verdict" section')
  else {
    let v1 = lines.findIndex((l, i) => i > v0 && /^##\s/.test(l)); if (v1 < 0) v1 = lines.length
    const verdict = lines.slice(v0, v1)
    const LABEL = /\*\*(decision|решение):?\*\*|\*\*(decision|решение):/i
    const decided = verdict.some(l => LABEL.test(l) && !PLACEHOLDER.test(l) && l.replace(LABEL, '').replace(/\*\*/g, '').trim().length > 2)
    if (!decided) add('report.md', v0 + 1, 'error', 'no decision line ("**Decision:** use / use with conditions / don\'t use")')
    verdict.forEach((l, k) => {
      if (/^\s*[-*\d.]*\s*\*\*(ask before paying|not checked|что спросить|не проверено)/i.test(l)) return
      // Each clause that names a vendor carries its own level.
      for (const part of l.replace(/\*\*[^*]+\*\*/g, '').split(/;|\s·\s/)) {
        if (VENDORS.test(part) && !LEVEL.test(part)) add('report.md', v0 + k + 1, 'error', `a vendor or model is named without a level: "${part.trim().slice(0, 90)}"`)
      }
      if (/\b(guess|probably|likely|seems to use)\b/i.test(l) && VENDORS.test(l)) add('report.md', v0 + k + 1, 'error', `a guess about a vendor in the verdict; guesses stay in the notes: "${l.trim().slice(0, 90)}"`)
    })
    if (!verdict.some(l => /not checked|не провер/i.test(l))) add('report.md', v0 + 1, 'warning', 'no "Not checked" item in the verdict')
  }
  lines.forEach((l, i) => { if (PLACEHOLDER.test(l) && !/^\s*<!--/.test(l)) add('report.md', i + 1, 'error', `template placeholder left: "${l.trim().slice(0, 80)}"`) })
  if (!/not legal advice|не юридическ/i.test(report)) add('report.md', 0, 'warning', 'say that the report is not legal advice')
}

// task.md
const task = read('task.md')
if (!task) add('task.md', 0, 'warning', 'missing: without a task the verdict is general (Quick check)')
else {
  const filled = task.split('\n').filter(l => /^\|\s*\d+\s*\|/.test(l) && l.split('|')[2]?.trim()).length
  if (!filled) add('task.md', 0, 'warning', 'the test set is empty')
}

const errors = findings.filter(f => f.level === 'error').length
if (args.includes('--json')) console.log(JSON.stringify({ errors, warnings: findings.length - errors, findings }, null, 2))
else {
  for (const f of findings) console.log(`${f.file}${f.line ? ':' + f.line : ''}  ${f.level === 'error' ? 'error  ' : 'warning'}  ${f.message}`)
  console.log(`\n${errors} error${errors === 1 ? '' : 's'}, ${findings.length - errors} warning${findings.length - errors === 1 ? '' : 's'}`)
}
process.exit(errors ? 1 : 0)
