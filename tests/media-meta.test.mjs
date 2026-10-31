import { test } from 'node:test'
import assert from 'node:assert/strict'
import { json, tmp, c2paPng, sampleVideo } from './helpers.mjs'

test('reads C2PA: claim generator, signer, actions, ingredient, IPTC source type', () => {
  const { code, data } = json('media-meta.mjs', [c2paPng(tmp())])
  assert.equal(code, 0)
  const m = data[0]
  assert.equal(m.c2pa, true)
  assert.equal(m.c2paClaimGenerator, 'Test Generator')
  assert.deepEqual(m.c2paSigners, ['Example Org'])
  assert.deepEqual(m.c2paActions, ['c2pa.created ("Created by a test model for the media-meta test.")'])
  assert.equal(m.c2paIngredient, true)
  assert.equal(m.aiSourceType, true)
})

test('video size comes from the codec entry', () => {
  const { data } = json('media-meta.mjs', [sampleVideo])
  assert.equal(`${data[0].width}x${data[0].height}`, '720x1280')
  assert.equal(data[0].c2pa, false)
})
