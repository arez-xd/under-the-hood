#!/usr/bin/env node
// Pulls the sentences that matter to a buyer out of a service's public terms, privacy and refund pages, word
// for word, grouped by topic, with the source and the date. Plain GET requests to the URLs given, or local
// .html/.txt/.md files (for pages rendered by JavaScript: save the text in the browser and pass the file).
// It finds sentences; it does not interpret them, and its output is not legal advice.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const HELP = `Usage: node terms.mjs <url|file> [...] [--out terms.md] [--json] [--context 1]

Topics: ownership and license of outputs, commercial use, public visibility, training on user data,
retention and deletion, third parties and sub-processors, refunds, cancellation and auto-renewal,
credits, liability, governing law and arbitration, changes to the terms.

  --out <file>    write Markdown to a file (default: print)
  --json          print JSON
  --context <n>   sentences of context around each match (default 0)

Exit code: 0 done, 1 a source could not be read, 2 usage error.`

const args = process.argv.slice(2)
if (!args.length || args.includes('--help') || args.includes('-h')) { console.log(HELP); process.exit(args.length ? 0 : 2) }
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const out = opt('--out'), asJson = args.includes('--json'), ctx = Math.max(0, parseInt(opt('--context', '0'), 10) || 0)
const sources = args.filter((a, i) => !a.startsWith('--') && !['--out', '--context'].includes(args[i - 1]))
if (!sources.length) { console.error('No URL or file given.\n\n' + HELP); process.exit(2) }

const TOPICS = [
  ['Ownership and license of outputs', /\b(you own|ownership|owns? (all|the) (right|output|content)|you may use (the |your |any )?(generated content|outputs?|results?|creations?)|exclusive to you|assign(s|ed)? to you|license (to|of|for) (the )?(output|content|generation)|grant(s)? (us|you) (a|an) [a-z -]*licen[cs]e|intellectual property|copyright)\b|права на (результат|контент)|исключительн\w+ прав|лицензи/i],
  ['Commercial use', /\b(commercial (uses?|usage|purposes?|rights|licen[cs]es?|projects?|work)|non-commercial|personal use only|for commercial)\b|коммерческ/i],
  ['Public visibility and attribution', /\b(public(ly)? (visible|available|display|gallery|feed)|made public|private mode|stealth|creative commons|cc[ -]by|attribution)\b|публичн|общедоступн/i],
  ['Training on your data', /\b(train(ing)?|fine-?tun\w*|improve (our|the) (models?|services?|ai)|machine learning|model improvement)\b|обучени|обучать/i],
  ['Opting out', /\b(opt[ -]?out|opt[ -]?in|turn off|disable)\b[^.]{0,80}\b(train|data|improv)|отказаться от/i],
  ['Retention and deletion', /\b(retain|retention|store[sd]? for|keep (your|the) [a-z ]+ for|delet(e|ion)|erase|30 days|90 days|backups?)\b|хран(ение|им|ятся)|удален/i],
  ['Third parties and sub-processors', /\b(sub-?processors?|third[- ]part(y|ies)|service providers?|share (your|personal) (data|information)|openai|anthropic|google|amazon web services|aws|microsoft azure|replicate|fal\.ai|stability)\b|третьим лицам|третьи лица|подрядчик/i],
  ['Refunds', /\b(refund\w*|money[- ]back|chargeback)\b|возврат/i],
  ['Cancellation and auto-renewal', /\b(cancel\w*|auto(matically)?[- ]?renew\w*|recurring|free trial|trial period)\b|отмен\w+ подписк|автопродлен|пробн\w+ период/i],
  ['Credits', /\b(credits?|tokens?)\b[^.]{0,80}\b(expire|expiration|non-?refundable|roll ?over|reset|forfeit)|кредит\w*[^.]{0,60}(сгора|истека)/i],
  ['Liability and warranty', /\b(as is|as available|no warrant\w*|limitation of liability|not (be )?liable|indemnif\w*)\b|ответственност/i],
  ['Governing law and arbitration', /\b(governing law|governed by|jurisdiction|arbitration|class action|venue|courts? of)\b|применимое право|арбитраж|подсудн/i],
  ['Changes to the terms', /\b(we may (change|modify|update|amend)|changes to (these|the) terms|at any time without notice)\b|вправе изменить|в одностороннем порядке/i],
]

const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16))).replace(/&rsquo;|&lsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
const toText = html => decode(html
  .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<\/(p|li|h[1-6]|div|section|tr|br|article)>|<br\s*\/?>/gi, '.\n')
  .replace(/<[^>]+>/g, ' '))
  .replace(/[ \t]+/g, ' ').replace(/\.\s*\.(\s*\.)*/g, '.').trim()
const sentences = text => text.split(/(?<=[.!?;])\s+(?=[A-ZА-ЯЁ0-9"“(«])|\n+/).map(s => s.trim()).filter(s => s.length > 25 && s.length < 900)

const date = new Date().toISOString().slice(0, 10)
const results = []
let failed = 0
for (const src of sources) {
  let raw = '', kind = 'file'
  try {
    if (/^https?:\/\//i.test(src)) {
      kind = 'url'
      const res = await fetch(src, { headers: { 'user-agent': 'Mozilla/5.0 (terms reader; one GET per page)', accept: 'text/html,text/plain' }, redirect: 'follow' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      raw = await res.text()
    } else {
      if (!existsSync(src)) throw new Error('no such file')
      raw = readFileSync(src, 'utf8')
    }
  } catch (e) { console.error(`Could not read ${src}: ${e.message}`); failed++; results.push({ source: src, error: e.message }); continue }
  const text = /<[a-z][\s\S]*>/i.test(raw) ? toText(raw) : raw
  const list = sentences(text)
  const words = text.split(/\s+/).length
  const topics = {}
  list.forEach((s, i) => {
    for (const [topic, re] of TOPICS) if (re.test(s)) {
      const quote = list.slice(Math.max(0, i - ctx), i + ctx + 1).join(' ')
      ;(topics[topic] ||= []).push(quote)
    }
  })
  for (const t in topics) topics[t] = [...new Set(topics[t])].slice(0, 12)
  const thin = words < 300
  results.push({ source: src, kind, read: date, words, thin, topics })
}

if (asJson) { console.log(JSON.stringify(results, null, 2)); process.exit(failed ? 1 : 0) }

let md = `# Terms, quoted\n\nRead ${date} by terms.mjs. Sentences are quoted word for word; read each in context before concluding. Not legal advice.\n`
for (const r of results) {
  md += `\n## ${r.source}\n\n`
  if (r.error) { md += `Not read: ${r.error}.\n`; continue }
  if (r.thin) md += `Only ${r.words} words came back. The page is probably rendered by JavaScript: open it in the browser, save the text, and pass the file.\n\n`
  for (const [topic] of TOPICS) {
    const qs = r.topics[topic]
    md += `### ${topic}\n\n`
    md += qs ? qs.map(q => `> ${q}`).join('\n\n') + '\n\n' : 'Nothing found on this page. Absence here is not absence in the terms: check the other pages.\n\n'
  }
}
if (out) { writeFileSync(out, md); console.log(`Wrote ${out}: ${results.length} source(s), ${failed} not read.`) }
else console.log(md)
process.exit(failed ? 1 : 0)
