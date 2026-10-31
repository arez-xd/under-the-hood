import { test } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { json, fixtures } from './helpers.mjs'

test('pulls the deciding sentences by topic', () => {
  const { code, data } = json('terms.mjs', [join(fixtures, 'terms.txt')])
  assert.equal(code, 0)
  const t = data[0].topics, has = (topic, re) => assert.ok((t[topic] || []).some(q => re.test(q)), `${topic}: ${re}`)
  has('Commercial use', /personal or commercial purposes/)
  has('Ownership and license of outputs', /exclusive to you/)
  has('Refunds', /no prorated refund/)
  has('Cancellation and auto-renewal', /renew automatically/)
  has('Training on your data', /improve our models/)
  has('Credits', /expire at the end of each billing cycle/)
  has('Governing law and arbitration', /governed by the laws/)
  assert.ok(!(t['Commercial use'] || []).some(q => /commercially reasonable/.test(q)), '"commercially reasonable" is not about commercial use')
})
