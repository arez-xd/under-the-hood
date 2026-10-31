import { test } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { run, json, fixtures, root } from './helpers.mjs'

const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 0.011, `${msg}: ${a} != ${b}`)

test('every billing period, daily credits, unlimited and pay-per-use plans', () => {
  const { code, data } = json('cost.mjs', [join(fixtures, 'pricing-periods.json')])
  assert.equal(code, 0)
  near(data.need, 1400, 'credits needed')
  near(data.payPerUse, 3, 'money charged per use')
  const rows = Object.fromEntries(data.rows.map(r => [r.plan, r]))
  near(rows['Weekly app'].monthly, 30.29, 'weekly price per month (× 52 / 12)')
  near(rows['Weekly app'].total, 73.29, 'weekly total')
  near(rows['Weekly app'].topupCost, 40, 'weekly top-ups: 2 × 500')
  near(rows['Free daily'].total, 3, 'daily credits cover the volume')
  near(rows['Free daily'].unused, 121, 'daily credits left')
  near(rows['Unlimited'].total, 33, 'unlimited: the fee plus pay per use')
  assert.equal(rows['Unlimited'].topups.length, 0)
  near(rows['Quarterly'].monthly, 20, 'quarterly price per month')
  near(rows['Quarterly'].total, 43, 'quarterly total')
})

test('vendor price as one number, several calls and tokens; your month against the vendor', () => {
  const { data } = json('cost.mjs', [join(fixtures, 'pricing-periods.json')])
  near(data.vendorMonth, 19.05, 'the same runs at the vendor: 200 × 0.04 + 300 × 0.0135 + 20 × 0.35')
  const ratio = Object.fromEntries(data.yourMonth.map(y => [y.plan, y.ratio]))
  near(ratio['Weekly app'], 3.85, 'weekly against the vendor')
  near(ratio['Unlimited'], 1.73, 'unlimited against the vendor')
  const mk = Object.fromEntries(data.markup.map(m => [m.action, Object.fromEntries(m.byPlan.map(b => [b.plan, b.markup]))]))
  near(mk['image']['Quarterly'], 2, 'image at full use of the quarterly credits')
  near(mk['two-step pipeline']['top-up 100'], 4.29, 'pipeline on the small top-up')
  assert.ok(!('chat message' in mk), 'an action with no credits has no per-credit markup')
})

test('the cheapest mix of top-ups covers the gap', () => {
  const { data } = json('cost.mjs', [join(fixtures, 'pricing-topups.json')])
  const yearly = data.rows[0]
  near(yearly.short, 466.67, 'gap')
  near(yearly.topupCost, 23.97, '2 × 200 + 1 × 75 is the cheapest cover')
  near(yearly.total, 134.46, 'total')
  const mk = Object.fromEntries(data.markup.map(m => [m.action, Object.fromEntries(m.byPlan.map(b => [b.plan, b.markup]))]))
  near(mk['8 s clip with sound']['Top plan, yearly'], 1.7, 'markup on the yearly plan')
  near(mk['8 s clip with sound']['top-up 75'], 3.55, 'markup on the smallest top-up')
  near(mk['15 s clip at 1080p']['Top plan, yearly'], 0.97, 'below the vendor price')
  assert.match(run('cost.mjs', [join(fixtures, 'pricing-topups.json')]).out, /Thin or negative margin: .*15 s clip at 1080p on Top plan, yearly/)
})

test('bad input is rejected with every reason', () => {
  const r = run('cost.mjs', [join(fixtures, 'pricing-invalid.json')])
  assert.equal(r.code, 1)
  assert.match(r.err, /period "monthly" is not one of/)
  assert.match(r.err, /vendorCost must be/)
})

test('the template runs', () => {
  const r = run('cost.mjs', [join(root, 'skills/under-the-hood/templates/pricing.json')])
  assert.equal(r.code, 0)
  assert.match(r.out, /## Plans/)
})
