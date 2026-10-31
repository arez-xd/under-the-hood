#!/usr/bin/env node
// A headless browser for the test. Opens a URL, optionally fills fields, clicks buttons and evaluates a script
// file in the page, then prints the page text, every network request (method, URL, status), JSON response
// bodies, console errors and the evaluation result.
//   node browse.mjs <url> [--fill "#sel=value"]... [--click "#sel"]... [--eval file.js] [--wait ms] [--html]
// Needs Playwright: npm i playwright && npx playwright install chromium
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const a = process.argv.slice(2)
if (!a.length || a.includes('--help')) { console.log('usage: node browse.mjs <url> [--fill "#sel=value"]... [--click "#sel"]... [--eval file.js] [--wait ms] [--html]'); process.exit(a.length ? 0 : 2) }
const url = a[0], all = k => a.flatMap((x, i) => x === k ? [a[i + 1]] : [])
const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1280, height: 900 } })
const reqs = [], bodies = [], errors = []
p.on('response', async r => { const req = r.request(); reqs.push(`${req.method()} ${r.url()} → ${r.status()}`); const ct = r.headers()['content-type'] || ''; if (ct.includes('json')) { try { bodies.push(`${r.url()}\n${(await r.text()).slice(0, 2000)}`) } catch {} } })
p.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
await p.goto(url, { waitUntil: 'networkidle' }).catch(e => errors.push(String(e)))
for (const f of all('--fill')) { const i = f.indexOf('='); await p.fill(f.slice(0, i), f.slice(i + 1)).catch(e => errors.push(String(e))) }
for (const c of all('--click')) { await p.click(c).catch(e => errors.push(String(e))); await p.waitForTimeout(400) }
await p.waitForTimeout(+(all('--wait')[0] || 600))
let evalOut = null
for (const f of all('--eval')) { try { evalOut = await p.evaluate(readFileSync(f, 'utf8')) } catch (e) { evalOut = 'eval error: ' + e.message } }
console.log(`URL ${p.url()}\nTITLE ${await p.title()}\n\n--- TEXT ---\n${(await p.innerText('body')).slice(0, 8000)}`)
if (a.includes('--html')) console.log(`\n--- HTML ---\n${(await p.content()).slice(0, 20000)}`)
console.log(`\n--- REQUESTS ---\n${reqs.join('\n')}`)
if (bodies.length) console.log(`\n--- JSON RESPONSES ---\n${bodies.join('\n\n')}`)
if (errors.length) console.log(`\n--- ERRORS ---\n${errors.join('\n')}`)
if (evalOut !== null) console.log(`\n--- EVAL ---\n${typeof evalOut === 'string' ? evalOut : JSON.stringify(evalOut, null, 2)}`)
await b.close()
