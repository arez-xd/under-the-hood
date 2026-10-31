import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import vm from 'node:vm'
import { scripts } from './helpers.mjs'

// stack-scan.js runs in a browser page. Here it runs in a sandbox with a stand-in page: one inline script, the
// HTML, two loaded resources and the response headers of the document.
const KEY = 'sk-proj-' + 'A1b2C3d4E5f6G7h8I9j0K1l2'
const CODE = `
  const catalogue = ["fal-ai/veo3.1/lite/image-to-video", "bytedance/seedance-2.0/text-to-video", "openai/gpt-image-2"]
  const blog = "https://example.test/blog/veo-2-a-comprehensive-guide"
  const key = "${KEY}"
  supabase.from("plans").select("*"); supabase.rpc("get_public_snapshot")
  fetch("https://abcd.supabase.co/functions/v1/estimate-cost")
`
const HTML = '<html><head><meta property="og:image" content="https://cdn.example.test/gpt-engineer-file-uploads/og.png"></head><body></body></html>'

async function scan() {
  const window = { __VUE__: undefined }
  const ctx = vm.createContext({
    window, self: window, console: { log() {} }, URL, atob: s => Buffer.from(s, 'base64').toString('latin1'),
    location: { href: 'https://example.test/', origin: 'https://example.test', hostname: 'example.test' },
    performance: { getEntriesByType: () => [{ name: 'https://abcd.supabase.co/rest/v1/plans?select=*' }, { name: 'https://www.googletagmanager.com/gtag/js?id=G-TEST' }] },
    document: {
      scripts: [{ src: '', textContent: CODE }], documentElement: { outerHTML: HTML }, cookie: '_ga=1; sb-abcd-auth-token=x',
      querySelectorAll: () => [], querySelector: () => null,
    },
    fetch: async () => ({ headers: new Map([['server', 'cloudflare'], ['cf-ray', 'test']]), text: async () => '' }),
    localStorage: {}, sessionStorage: {},
  })
  return vm.runInContext(readFileSync(join(scripts, 'stack-scan.js'), 'utf8'), ctx)
}

test('finds the builder, backend, hosting and analytics with their levels', async () => {
  const r = await scan()
  const tell = name => r.tells.find(t => t.name === name)
  assert.equal(tell('Supabase')?.level, 'direct', 'a request to the Supabase host was made')
  assert.equal(tell('Lovable')?.level, 'indirect', 'an asset path of the builder')
  assert.ok(tell('Cloudflare'), 'hosting from the response headers')
  assert.ok(tell('Google Analytics'), 'analytics from a loaded script')
})

test('collects model ids, fal partner ids included, and skips article slugs', async () => {
  const ids = (await scan()).models.map(m => m.id)
  assert.ok(ids.includes('fal-ai/veo3.1/lite/image-to-video'))
  assert.ok(ids.includes('bytedance/seedance-2.0/text-to-video'))
  assert.ok(ids.includes('openai/gpt-image-2'))
  assert.ok(!ids.some(id => /guide/.test(id)), 'an article slug is not a model')
})

test('lists Supabase tables, RPCs and functions named in the code', async () => {
  const s = (await scan()).supabase
  assert.ok(s.tables.includes('plans'))
  assert.ok(s.rpc.includes('get_public_snapshot'))
  assert.ok(s.functions.includes('estimate-cost'))
})

test('reports a shipped secret masked, never in full', async () => {
  const r = await scan()
  assert.equal(r.secrets.length, 1)
  assert.equal(r.secrets[0].type, 'OpenAI-style secret key')
  assert.ok(!JSON.stringify(r).includes(KEY), 'the full key must not appear in the report')
  assert.deepEqual(Array.from(r.cookieNames), ['_ga', 'sb-abcd-auth-token'], 'cookie names only, values never read')
})
