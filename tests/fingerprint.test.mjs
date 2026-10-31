import { test } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { json, fixtures, sampleVideo } from './helpers.mjs'

test('measures an MP4 from its frame timing and codec entry', () => {
  const { data } = json('fingerprint.mjs', ['video', sampleVideo, '--profile', join(fixtures, 'model-profile.json')])
  const v = data.service[0]
  assert.equal(v.resolution, '720x1280')
  assert.equal(v.fps, 16)
  assert.equal(v.duration, 4)
  assert.equal(v.frames, 64)
  assert.equal(v.codec, 'avc1')
  assert.equal(v.audio, false)
  assert.equal(v.variableFrameRate, false)
})

test('lists the properties outside the model profile and exits 1', () => {
  const { code, data } = json('fingerprint.mjs', ['video', sampleVideo, '--profile', join(fixtures, 'model-profile.json')])
  assert.equal(code, 1)
  const outside = data.comparison.filter(r => r.outside.length).map(r => r.property).sort()
  assert.deepEqual(outside, ['audio', 'fps'])
})

test('language model runs: the service sits closer to the small model', () => {
  const { code, data } = json('fingerprint.mjs', ['llm', join(fixtures, 'llm-runs.jsonl')])
  assert.equal(code, 0)
  const closest = Object.fromEntries(data.verdicts.map(v => [v.measure, v.closest]))
  assert.equal(closest.ttft_ms, 'small')
  assert.equal(closest.chars_per_s, 'small')
})
