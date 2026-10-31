import { test } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { json, fixtures } from './helpers.mjs'

test('a report in Russian with day.month.year dates and level words passes', () => {
  const { code, data } = json('claims-check.mjs', [join(fixtures, 'run-ru')])
  assert.equal(code, 0)
  assert.equal(data.errors, 0)
})

test('a placeholder decision, a vendor without a level and a guess are errors', () => {
  const { code, data } = json('claims-check.mjs', [join(fixtures, 'run-bad')])
  assert.equal(code, 1)
  const messages = data.findings.filter(f => f.level === 'error').map(f => f.message).join('\n')
  assert.match(messages, /no decision line/)
  assert.match(messages, /named without a level/)
  assert.match(messages, /a guess about a vendor/)
  assert.match(messages, /template placeholder left/)
})
