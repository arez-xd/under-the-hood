#!/usr/bin/env node
// What the user's month costs on each plan: what the volume needs (retries included), whether the plan covers
// it, the cheapest top-ups for the rest, money charged per action outside credits, the total, the cost per
// usable result, and credits left unused. With vendor prices: the user's month against the same volume at the
// model's vendor, and each action's price on every plan's credit price against the vendor's.
// Input: a pricing JSON (templates/pricing.json shows the shape). Reads the file only.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const HELP = `Usage: node cost.mjs <pricing.json> [--out cost.md] [--json]

pricing.json:
  currency   "USD"
  plans[]    name, price, period, credits, creditsPer, rollover (bool), commercial (bool), note
             period and creditsPer: day | week | 28d | month | quarter | half-year | year
               (28d is "every 4 weeks": 13 charges a year; creditsPer defaults to period)
             credits: a number, 0 for a plan with no credits, or "unlimited"
  topups[]   credits, price                     one-time packs; the cheapest mix that covers the gap is bought
  actions[]  name, credits                      credits per action on the settings the task needs
             price (optional)                   money per action charged outside credits (pay per use)
             vendorCost (optional)              the model vendor's public price for the same action:
                                                  a number, or [{ "call": "...", "cost": 0.4 }, ...] for an
                                                  action that makes several vendor calls, or
                                                  { "tokensIn", "tokensOut", "perMillionIn", "perMillionOut" }
             vendorSource (optional)            the vendor's URL and the date read
  volume[]   action, perMonth, attemptsPerUsable   attempts it took to get one usable result (layer 4)

Exit code: 0 done, 1 bad input, 2 usage error.`

const args = process.argv.slice(2)
if (!args.length || args.includes('--help') || args.includes('-h')) { console.log(HELP); process.exit(args.length ? 0 : 2) }
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined }
const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--out')
if (!file || !existsSync(file)) { console.error(`No such file: ${file || '(none)'}`); process.exit(1) }
let P
try { P = JSON.parse(readFileSync(file, 'utf8')) } catch (e) { console.error(`Not valid JSON: ${e.message}`); process.exit(1) }

const PER_YEAR = { day: 365, week: 52, '28d': 13, month: 12, quarter: 4, 'half-year': 2, year: 1 }
const perMonth = (value, period) => value * PER_YEAR[period] / 12
const cur = P.currency || 'USD'
const plans = P.plans || [], topups = (P.topups || []).filter(t => t.credits > 0), actions = P.actions || [], volume = P.volume || []

// The vendor's price for one action: one number, several calls added up, or tokens at per-million prices.
const vendorOf = a => {
  const v = a.vendorCost
  if (v === undefined || v === null) return null
  if (typeof v === 'number') return v > 0 ? v : NaN
  if (Array.isArray(v)) { const s = v.reduce((t, c) => t + Number(c?.cost), 0); return s > 0 ? s : NaN }
  if (typeof v === 'object') { const s = ((+v.tokensIn || 0) * (+v.perMillionIn || 0) + (+v.tokensOut || 0) * (+v.perMillionOut || 0)) / 1e6; return s > 0 ? s : NaN }
  return NaN
}

const errors = []
if (!plans.length) errors.push('no plans')
if (!volume.length) errors.push('no volume')
const act = Object.fromEntries(actions.map(a => [a.name, a]))
for (const a of actions) {
  if (typeof a.credits !== 'number' && typeof a.price !== 'number') errors.push(`action "${a.name}" needs credits, a price, or both`)
  if (Number.isNaN(vendorOf(a))) errors.push(`action "${a.name}": vendorCost must be a positive number, a list of { call, cost }, or { tokensIn, tokensOut, perMillionIn, perMillionOut }`)
}
for (const v of volume) if (!(v.action in act)) errors.push(`volume names an action not in actions: "${v.action}"`)
for (const p of plans) {
  if (typeof p.price !== 'number') errors.push(`plan "${p.name}" needs a numeric price`)
  if (typeof p.credits !== 'number' && p.credits !== 'unlimited') errors.push(`plan "${p.name}": credits must be a number (0 for none) or "unlimited"`)
  if (!(p.period in PER_YEAR)) errors.push(`plan "${p.name}": period "${p.period}" is not one of ${Object.keys(PER_YEAR).join(', ')}`)
  if (p.creditsPer !== undefined && !(p.creditsPer in PER_YEAR)) errors.push(`plan "${p.name}": creditsPer "${p.creditsPer}" is not one of ${Object.keys(PER_YEAR).join(', ')}`)
}
if (errors.length) { console.error(errors.map(e => '  ' + e).join('\n')); process.exit(1) }

const lines = volume.map(v => {
  const a = act[v.action], attempts = Math.max(1, +v.attemptsPerUsable || 1), runs = +v.perMonth * attempts
  return { action: v.action, perMonth: +v.perMonth, attempts, credits: (+a.credits || 0) * runs, money: (+a.price || 0) * runs, vendor: vendorOf(a) === null ? null : vendorOf(a) * runs }
})
const need = lines.reduce((s, l) => s + l.credits, 0)
const payPerUse = lines.reduce((s, l) => s + l.money, 0)
const usable = lines.reduce((s, l) => s + l.perMonth, 0)

// The cheapest mix of top-up packs that brings at least `gap` credits: min cost to reach c credits, for every c.
function cover(gap) {
  if (gap <= 0) return { cost: 0, credits: 0, mix: [] }
  if (!topups.length) return null
  const best = [...topups].sort((a, b) => a.price / a.credits - b.price / b.credits)[0]
  let n = Math.ceil(gap), bulk = 0
  const LIMIT = 2e6
  if (n > LIMIT) { bulk = Math.ceil((n - LIMIT / 2) / best.credits); n = Math.max(0, n - bulk * best.credits) }
  const cost = new Float64Array(n + 1).fill(Infinity), pick = new Int32Array(n + 1).fill(-1)
  cost[0] = 0
  for (let c = 1; c <= n; c++) for (let j = 0; j < topups.length; j++) {
    const v = cost[Math.max(0, c - topups[j].credits)] + topups[j].price
    if (v < cost[c] - 1e-9) { cost[c] = v; pick[c] = j }
  }
  const count = topups.map(() => 0)
  for (let c = n; c > 0; c = Math.max(0, c - topups[pick[c]].credits)) count[pick[c]]++
  count[topups.indexOf(best)] += bulk
  const mix = topups.map((t, j) => ({ credits: t.credits, price: t.price, n: count[j] })).filter(m => m.n)
  return { cost: mix.reduce((s, m) => s + m.n * m.price, 0), credits: mix.reduce((s, m) => s + m.n * m.credits, 0), mix }
}

const billedText = p => p.period === 'year' ? `${p.price} ${cur}/year up front` : p.period === '28d' ? `${p.price} ${cur} every 28 days (13 a year)` : `${p.price} ${cur}/${p.period}`
const rows = plans.map(p => {
  const unlimited = p.credits === 'unlimited'
  const monthly = perMonth(p.price, p.period)
  const included = unlimited ? Infinity : perMonth(p.credits, p.creditsPer || p.period)
  const short = unlimited ? 0 : Math.max(0, need - included)
  const buy = cover(short)
  const total = buy ? monthly + buy.cost + payPerUse : null
  const left = unlimited || !buy ? 0 : included + buy.credits - need
  return {
    plan: p.name, billed: billedText(p), monthly: +monthly.toFixed(2), unlimited, included: unlimited ? 'unlimited' : Math.round(included),
    short: +short.toFixed(2), topups: buy ? buy.mix : null, topupCost: buy ? +buy.cost.toFixed(2) : null, payPerUse: +payPerUse.toFixed(2),
    total: total === null ? null : +total.toFixed(2), perUsable: total !== null && usable ? +(total / usable).toFixed(2) : null,
    unused: Math.round(left), unusedFate: p.rollover ? 'roll over' : (p.creditsPer || p.period) === 'year' ? 'expire at the end of the year' : 'expire',
    commercial: p.commercial, note: p.note || '',
  }
})

// The vendor side. Per action at full use of each plan's credits (and each top-up), and the user's whole month.
const creditPlans = plans.filter(p => p.price > 0 && typeof p.credits === 'number' && p.credits > 0)
const sources = [...creditPlans.map(p => ({ name: p.name, perCredit: perMonth(p.price, p.period) / perMonth(p.credits, p.creditsPer || p.period) })),
  ...topups.map(t => ({ name: `top-up ${t.credits}`, perCredit: t.price / t.credits }))]
const markup = actions.filter(a => vendorOf(a) !== null && (+a.credits || 0) > 0).map(a => ({
  action: a.name, credits: +a.credits, vendorCost: +vendorOf(a).toFixed(4), vendorSource: a.vendorSource || '',
  byPlan: sources.map(s => { const price = a.credits * s.perCredit + (+a.price || 0); return { plan: s.name, price: +price.toFixed(2), markup: +(price / vendorOf(a)).toFixed(2) } }),
}))
const missingVendor = lines.filter(l => l.vendor === null).map(l => l.action)
const vendorMonth = missingVendor.length ? null : lines.reduce((s, l) => s + l.vendor, 0)
const yourMonth = vendorMonth ? rows.filter(r => r.total !== null).map(r => ({ plan: r.plan, total: r.total, vendor: +vendorMonth.toFixed(2), ratio: +(r.total / vendorMonth).toFixed(2) })) : []

if (args.includes('--json')) { console.log(JSON.stringify({ need, payPerUse, usable, lines, rows, vendorMonth, yourMonth, markup, missingVendor }, null, 2)); process.exit(0) }

const fmt = n => n === null || n === undefined ? '—' : typeof n === 'string' ? n : n.toLocaleString('en', { maximumFractionDigits: 2 })
const mixText = r => r.topups === null ? 'not covered: no top-ups' : r.topups.length ? `${r.topups.map(m => `${m.n} × ${m.credits}`).join(' + ')} = ${fmt(r.topupCost)}` : '—'
let md = `# Cost of the month\n\nComputed ${new Date().toISOString().slice(0, 10)} by cost.mjs from \`${file.split('/').pop()}\`. Prices as entered; check them against the pricing page and its date.\n\n`
md += `## Volume\n\n| Action | Per month | Attempts per usable | Credits |${payPerUse ? ' Charged per use |' : ''}\n|---|---|---|---|${payPerUse ? '---|' : ''}\n`
for (const l of lines) md += `| ${l.action} | ${l.perMonth} | ${l.attempts} | ${fmt(l.credits)} |${payPerUse ? ` ${fmt(+l.money.toFixed(2))} |` : ''}\n`
md += `| **Total** | ${usable} usable | | **${fmt(need)}** |${payPerUse ? ` **${fmt(+payPerUse.toFixed(2))}** |` : ''}\n\n`
md += `## Plans\n\nPer month: a 28-day price × 13 / 12, a weekly one × 52 / 12, a yearly one / 12.\n\n| Plan | Billed | Per month | Credits per month | Short | Top-ups | ${payPerUse ? 'Per use | ' : ''}Total per month | Per usable action | Credits left | Commercial use |\n|---|---|---|---|---|---|${payPerUse ? '---|' : ''}---|---|---|---|\n`
for (const r of rows) md += `| ${r.plan} | ${r.billed} | ${fmt(r.monthly)} | ${fmt(r.included)} | ${fmt(r.short)} | ${mixText(r)} | ${payPerUse ? `${fmt(r.payPerUse)} | ` : ''}${fmt(r.total)} | ${fmt(r.perUsable)} | ${r.unlimited ? '—' : `${fmt(r.unused)} (${r.unusedFate})`} | ${r.commercial === undefined ? '?' : r.commercial ? 'yes' : 'no'} |\n`
const ok = rows.filter(r => r.total !== null && r.commercial !== false).sort((a, b) => a.total - b.total)[0]
md += `\n${ok ? `Cheapest plan that covers the volume${rows.some(r => r.commercial === false) ? ' with commercial use' : ''}: **${ok.plan}**, ${fmt(ok.total)} ${cur} a month, ${fmt(ok.perUsable)} ${cur} per usable action.` : 'No plan covers the volume as entered.'}\n`
if (rows.some(r => r.unlimited)) md += `\n"Unlimited" is taken at its word here: read the fair-use limits in the terms (daily caps, slower queue) and note them.\n`

if (vendorMonth !== null || markup.length) {
  md += `\n## Against the vendor\n\nThe model vendor's public prices for the same actions and parameters. An estimate: the service's real cost also includes infrastructure, failed jobs and discounts the public can't see.\n`
  if (vendorMonth !== null) {
    md += `\n### Your month\n\nThe same ${lines.reduce((s, l) => s + l.perMonth * l.attempts, 0)} runs (retries included) at the vendor: **${fmt(+vendorMonth.toFixed(2))} ${cur}**.\n\n| Plan | Your month | At the vendor | × |\n|---|---|---|---|\n`
    for (const y of yourMonth) md += `| ${y.plan} | ${fmt(y.total)} | ${fmt(y.vendor)} | ×${fmt(y.ratio)} |\n`
  } else md += `\nYour month at the vendor: not computed, no vendor price for ${missingVendor.map(a => `"${a}"`).join(', ')}.\n`
  if (markup.length && sources.length) {
    md += `\n### One action at full use of each plan's credits\n\n| Action | Credits | Vendor price | ${sources.map(s => s.name).join(' | ')} |\n|---|---|---|${sources.map(() => '---').join('|')}|\n`
    for (const m of markup) md += `| ${m.action} | ${m.credits} | ${fmt(m.vendorCost)} | ${m.byPlan.map(b => `${fmt(b.price)} (×${fmt(b.markup)})`).join(' | ')} |\n`
    const thin = markup.flatMap(m => m.byPlan.filter(b => b.markup < 1.3).map(b => `${m.action} on ${b.plan} (×${fmt(b.markup)})`))
    md += thin.length ? `\nThin or negative margin: ${thin.join('; ')}. Serving a cheaper model pays most here; if the user tests for substitution, test these settings first (references/substitution.md).\n` : `\nNo action is priced within 1.3× of the vendor's price on any plan.\n`
  }
  const srcs = [...new Set(actions.map(a => a.vendorSource).filter(Boolean))]
  if (srcs.length) md += `\nVendor prices: ${srcs.join('; ')}.\n`
}
md += `\nNot included: taxes, seats, paid extras (upscaling, export formats, watermark removal), price changes. Add them to the report from layer 5.\n`
const out = opt('--out')
if (out) { writeFileSync(out, md); console.log(`Wrote ${out}`) } else console.log(md)
