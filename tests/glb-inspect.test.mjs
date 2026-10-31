import { test } from 'node:test'
import assert from 'node:assert/strict'
import { json, run, tmp, triangleGlb } from './helpers.mjs'

test('counts triangles and measures the world-space size through node transforms', () => {
  const { code, data } = json('glb-inspect.mjs', [triangleGlb(tmp())])
  assert.equal(code, 0)
  const g = data[0]
  assert.equal(g.triangles, 1)
  assert.equal(g.vertices, 3)
  assert.equal(g.generator, 'uth-test')
  assert.deepEqual(g.sizeMetres, [2, 2, 0])
  assert.equal(g.attributes.normal, 0)
})

test('flags a result over the triangle budget', () => {
  const r = run('glb-inspect.mjs', [triangleGlb(tmp()), '--budget-tris', '0.5'])
  assert.equal(r.code, 1)
  assert.match(r.out, /OVER BUDGET/)
})
