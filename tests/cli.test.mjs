import { test } from 'node:test'
import assert from 'node:assert/strict'
import { run } from './helpers.mjs'

const SCRIPTS = ['claims-check.mjs', 'cost.mjs', 'fingerprint.mjs', 'glb-inspect.mjs', 'media-meta.mjs', 'report.mjs', 'terms.mjs']

for (const s of SCRIPTS) {
  test(`${s}: --help prints usage and exits 0`, () => {
    const r = run(s, ['--help'])
    assert.equal(r.code, 0)
    assert.match(r.out, /Usage/)
  })
  test(`${s}: no arguments exits 2`, () => {
    assert.equal(run(s).code, 2)
  })
}

test('missing inputs fail with a message', () => {
  assert.equal(run('cost.mjs', ['no-such.json']).code, 1)
  assert.equal(run('media-meta.mjs', ['no-such.png']).code, 1)
  assert.equal(run('claims-check.mjs', ['no-such-folder']).code, 2)
  assert.equal(run('fingerprint.mjs', ['video', 'no-such.mp4', '--profile', 'no-such.json']).code, 1)
})
