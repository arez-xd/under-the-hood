#!/usr/bin/env node
// Renders a run folder's report.md (and claims.md, cost.md if present) into one self-contained report.html
// for reading. Handles the Markdown the templates use: headings, paragraphs, lists, tables, quotes, code,
// bold, italics and links. Writes report.html into the folder; reads nothing else.
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const HELP = `Usage: node report.mjs <run folder> [--out report.html]

Exit code: 0 written, 1 no report.md, 2 usage error.`
const args = process.argv.slice(2)
if (!args.length || args.includes('--help') || args.includes('-h')) { console.log(HELP); process.exit(args.length ? 0 : 2) }
const dir = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--out')
if (!dir || !existsSync(dir) || !statSync(dir).isDirectory()) { console.error(`Not a folder: ${dir}`); process.exit(2) }
if (!existsSync(join(dir, 'report.md'))) { console.error('No report.md in the folder.'); process.exit(1) }
const outIdx = args.indexOf('--out')
const out = outIdx >= 0 ? args[outIdx + 1] : join(dir, 'report.html')

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const inline = s => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
  .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>')

function md(src) {
  const L = src.split('\n'), html = []
  let i = 0
  while (i < L.length) {
    const l = L[i]
    if (/^```/.test(l)) { const b = []; i++; while (i < L.length && !/^```/.test(L[i])) b.push(L[i++]); i++; html.push(`<pre><code>${esc(b.join('\n'))}</code></pre>`); continue }
    const h = /^(#{1,4})\s+(.*)/.exec(l)
    if (h) { html.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue }
    if (/^\s*\|/.test(l) && /^\s*\|?\s*:?-{2,}/.test(L[i + 1] || '')) {
      const row = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => inline(c.trim()))
      const head = row(l); i += 2
      const body = []
      while (i < L.length && /^\s*\|/.test(L[i])) body.push(row(L[i++]))
      html.push(`<div class="t"><table><thead><tr>${head.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)
      continue
    }
    if (/^>\s?/.test(l)) { const b = []; while (i < L.length && /^>\s?/.test(L[i])) b.push(L[i++].replace(/^>\s?/, '')); html.push(`<blockquote>${inline(b.join(' '))}</blockquote>`); continue }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      const ordered = /^\s*\d+\./.test(l), items = []
      while (i < L.length && /^\s*([-*]|\d+\.)\s+/.test(L[i])) {
        let item = L[i++].replace(/^\s*([-*]|\d+\.)\s+/, '')
        const sub = []
        while (i < L.length && /^\s{2,}([-*]|\d+\.)\s+/.test(L[i])) sub.push(`<li>${inline(L[i++].replace(/^\s+([-*]|\d+\.)\s+/, ''))}</li>`)
        items.push(`<li>${inline(item)}${sub.length ? `<ul>${sub.join('')}</ul>` : ''}</li>`)
      }
      html.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`)
      continue
    }
    if (!l.trim()) { i++; continue }
    const p = []
    while (i < L.length && L[i].trim() && !/^(#{1,4}\s|```|>|\s*\||\s*([-*]|\d+\.)\s)/.test(L[i])) p.push(L[i++])
    html.push(`<p>${inline(p.join(' '))}</p>`)
  }
  return html.join('\n')
}

const parts = ['report.md', 'claims.md', 'cost.md'].filter(f => existsSync(join(dir, f))).map(f => md(readFileSync(join(dir, f), 'utf8')))
const title = (readFileSync(join(dir, 'report.md'), 'utf8').match(/^#\s+(.+)/m) || [, 'Under the hood'])[1]
const lang = /[А-Яа-яЁё]/.test(readFileSync(join(dir, 'report.md'), 'utf8')) ? 'ru' : 'en'
const page = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>
:root{--bg:#fff;--fg:#18181b;--mute:#52525b;--line:#e4e4e7;--soft:#f4f4f5;--link:#2563eb}
@media (prefers-color-scheme:dark){:root{--bg:#0f0f11;--fg:#ededf0;--mute:#a1a1aa;--line:#2a2a30;--soft:#18181b;--link:#93c5fd}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,system-ui,sans-serif}
main{max-width:860px;margin:0 auto;padding:40px 16px 80px}
h1{font-size:30px;line-height:1.2;margin:0 0 8px}h2{font-size:22px;margin:40px 0 12px;padding-top:16px;border-top:1px solid var(--line)}h3{font-size:17px;margin:24px 0 8px}
p,li{color:var(--fg)}a{color:var(--link)}code{font:14px ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--soft);padding:1px 5px;border-radius:5px}
pre{background:var(--soft);padding:14px;border-radius:10px;overflow:auto}pre code{background:none;padding:0}
blockquote{margin:12px 0;padding:8px 14px;border-left:3px solid var(--line);color:var(--mute)}
.t{overflow-x:auto;margin:12px 0}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;vertical-align:top;padding:8px 10px;border-bottom:1px solid var(--line)}th{color:var(--mute);font-weight:600}
</style></head><body><main>
${parts.join('\n<hr style="border:0;border-top:1px solid var(--line);margin:48px 0">\n')}
</main></body></html>`
writeFileSync(out, page)
console.log(`Wrote ${out}`)
