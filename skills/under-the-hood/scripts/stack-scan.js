// Finds what a web service is built on, from what the page has already loaded: builder platform, framework,
// hosting, backend, model vendors and model ids, payments, analytics, support, and secret-shaped strings.
// Paste into the browser console, or evaluate the file's text with a browser tool; the expression's value is
// the report (also logged as JSON). It is async: await it where the runner allows.
// Reads only: resource URLs, same-origin script text (already downloaded; re-read from cache), meta tags,
// DOM attributes, global objects, and the NAMES of cookies and storage keys. Values are never read or sent.
// Every tell has a level: "direct" = a request to that host was made by this page; "indirect" = present in
// code, markup or headers with no request seen. Calls made by the server are invisible from here.
(async () => {
  const MAX_SCRIPTS = 25, MAX_BYTES = 8e6
  const now = new Date().toISOString()
  const resources = performance.getEntriesByType('resource').map(r => r.name)
  const hostsSeen = new Set(resources.map(u => { try { return new URL(u).host } catch { return '' } }).filter(Boolean))

  // Same-origin and CDN script text the page already loaded.
  const scriptUrls = [...new Set([...document.scripts].map(s => s.src).filter(Boolean))]
  const texts = []
  for (const s of document.scripts) if (!s.src && s.textContent.trim()) texts.push({ source: 'inline script', text: s.textContent })
  let read = 0
  for (const url of scriptUrls.slice(0, MAX_SCRIPTS)) {
    try {
      const u = new URL(url)
      if (u.origin !== location.origin) continue
      const res = await fetch(url, { cache: 'force-cache', credentials: 'same-origin' })
      const t = await res.text()
      if (read + t.length > MAX_BYTES) break
      read += t.length
      texts.push({ source: u.pathname, text: t })
    } catch {}
  }
  const html = document.documentElement.outerHTML
  texts.push({ source: 'document', text: html })

  // Response headers of this document (one plain GET of the same URL, from cache when possible).
  let headers = {}
  try {
    const r = await fetch(location.href, { cache: 'force-cache', credentials: 'same-origin' })
    r.headers.forEach((v, k) => { headers[k] = v })
  } catch {}

  const metas = Object.fromEntries([...document.querySelectorAll('meta[name], meta[property]')].map(m => [m.getAttribute('name') || m.getAttribute('property'), m.content]))
  const cookieNames = (() => { try { return document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(Boolean) } catch { return [] } })()
  const storageKeys = (() => { try { return [...Object.keys(localStorage), ...Object.keys(sessionStorage)] } catch { return [] } })()
  const globals = Object.keys(window)

  const tells = []
  const add = (layer, name, level, source, snippet) => {
    let t = tells.find(x => x.layer === layer && x.name === name)
    if (!t) tells.push(t = { layer, name, level, evidence: [] })
    if (level === 'direct') t.level = 'direct'
    if (t.evidence.length < 4) t.evidence.push({ source, snippet: String(snippet).slice(0, 160) })
  }
  const findIn = (re) => {
    for (const { source, text } of texts) {
      const m = re.exec(text)
      if (m) {
        const line = text.slice(0, m.index).split('\n').length
        return { source: `${source}:${line}`, snippet: text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).replace(/\s+/g, ' ') }
      }
    }
    return null
  }
  const hostMatch = re => [...hostsSeen].find(h => re.test(h))

  // [layer, name, host regex (requests), code regex (text), extra check]
  const RULES = [
    ['builder', 'Lovable', /lovable(project)?\.(app|com)$/, /gpt-engineer-file-uploads|lovable-tagger|lovableproject\.com/],
    ['builder', 'Base44', /base44\.app$/, /@base44\/sdk|base44\.app/],
    ['builder', 'Replit', /\.replit\.(app|dev)$|\.repl\.co$/, /\.replit\.app|\.repl\.co/],
    ['builder', 'Bolt', /bolt\.(new|host)$/, /bolt\.new|bolt\.host/],
    ['builder', 'Framer', /framerusercontent\.com$|framer\.com$/, /framerusercontent\.com/],
    ['builder', 'Webflow', /website-files\.com$|webflow\.com$/, /data-wf-site=|data-wf-page=/],
    ['builder', 'Wix', /wixstatic\.com$|parastorage\.com$/, /static\.wixstatic\.com/],
    ['builder', 'Squarespace', /squarespace\.com$/, /static1\.squarespace\.com/],
    ['builder', 'Bubble', /bubble\.io$/, /\/package\/run_js|bubble_session_uid/],
    ['framework', 'Flutter web', null, /main\.dart\.js|flt-glass-pane|flutter\.js/],
    ['framework', 'Next.js', null, /__NEXT_DATA__|self\.__next_f|\/_next\/static\//],
    ['framework', 'Nuxt', null, /__NUXT__|\/_nuxt\//],
    ['framework', 'SvelteKit', null, /__sveltekit_|\/_app\/immutable\//],
    ['framework', 'Remix', null, /__remixContext/],
    ['framework', 'Astro', null, /<astro-island/],
    ['framework', 'Angular', null, /ng-version=/],
    ['backend', 'Supabase', /\.supabase\.co$/, /[a-z0-9]{20}\.supabase\.co/],
    ['backend', 'Firebase', /firebaseapp\.com$|firestore\.googleapis\.com$|identitytoolkit\.googleapis\.com$|firebaseio\.com$/, /firebaseapp\.com|firestore\.googleapis\.com/],
    ['backend', 'Convex', /convex\.cloud$/, /convex\.cloud/],
    ['backend', 'Appwrite', /appwrite/, /appwrite\.io/],
    ['auth', 'Clerk', /clerk\.accounts\.dev$|^clerk\./, /clerk\.accounts\.dev|__clerk/],
    ['auth', 'Auth0', /auth0\.com$/, /\.auth0\.com/],
    ['model vendor', 'OpenAI', /api\.openai\.com$|oaidalleapiprodscus/, /api\.openai\.com/],
    ['model vendor', 'Anthropic', /api\.anthropic\.com$/, /api\.anthropic\.com/],
    ['model vendor', 'Google AI', /generativelanguage\.googleapis\.com$|aiplatform\.googleapis\.com$/, /generativelanguage\.googleapis\.com|aiplatform\.googleapis\.com/],
    ['model vendor', 'fal', /(^|\.)fal\.(run|media|ai)$/, /fal\.run|fal-ai\/[a-z0-9]/],
    ['model vendor', 'Replicate', /replicate\.(com|delivery)$/, /api\.replicate\.com|replicate\.delivery/],
    ['model vendor', 'OpenRouter', /openrouter\.ai$/, /openrouter\.ai\/api/],
    ['model vendor', 'Together', /together\.(xyz|ai)$/, /api\.together\.xyz/],
    ['model vendor', 'Groq', /api\.groq\.com$/, /api\.groq\.com/],
    ['model vendor', 'Fireworks', /fireworks\.ai$/, /api\.fireworks\.ai/],
    ['model vendor', 'Mistral', /api\.mistral\.ai$/, /api\.mistral\.ai/],
    ['model vendor', 'DeepSeek', /api\.deepseek\.com$/, /api\.deepseek\.com/],
    ['model vendor', 'xAI', /api\.x\.ai$/, /api\.x\.ai/],
    ['model vendor', 'ElevenLabs', /elevenlabs\.io$/, /api\.elevenlabs\.io/],
    ['model vendor', 'Runway', /runwayml\.com$/, /api\.(dev\.)?runwayml\.com/],
    ['model vendor', 'Luma', /lumalabs\.ai$/, /api\.lumalabs\.ai/],
    ['model vendor', 'Stability', /stability\.ai$/, /api\.stability\.ai/],
    ['model vendor', 'Black Forest Labs', /bfl\.(ai|ml)$/, /api\.bfl\.(ai|ml)/],
    ['model vendor', 'Ideogram', /ideogram\.ai$/, /api\.ideogram\.ai/],
    ['model vendor', 'Meshy', /meshy\.ai$/, /api\.meshy\.ai/],
    ['model vendor', 'Tripo', /tripo3d\.ai$/, /api\.tripo3d\.ai/],
    ['agent tooling', 'LangSmith', /smith\.langchain\.com$/, /smith\.langchain\.com/],
    ['agent tooling', 'Langfuse', /langfuse\.com$/, /langfuse\.com/],
    ['agent tooling', 'Helicone', /helicone\.ai$/, /helicone\.ai/],
    ['payments', 'Stripe', /stripe\.com$/, /js\.stripe\.com|checkout\.stripe\.com|buy\.stripe\.com/],
    ['payments', 'Paddle', /paddle\.com$/, /cdn\.paddle\.com/],
    ['payments', 'Lemon Squeezy', /lemonsqueezy\.com$/, /lemonsqueezy\.com/],
    ['payments', 'Polar', /polar\.sh$/, /polar\.sh/],
    ['payments', 'Chargebee', /chargebee\.com$/, /js\.chargebee\.com/],
    ['payments', 'Solidgate', /solidgate/, /solidgate/i],
    ['analytics', 'PostHog', /posthog\.com$/, /i\.posthog\.com|posthog-js/],
    ['analytics', 'Google Analytics', /google-analytics\.com$|googletagmanager\.com$/, /gtag\/js\?id=G-|GTM-[A-Z0-9]+/],
    ['analytics', 'Amplitude', /amplitude\.com$/, /amplitude\.com/],
    ['analytics', 'Mixpanel', /mixpanel\.com$/, /mixpanel\.com/],
    ['analytics', 'Meta pixel', /connect\.facebook\.net$|facebook\.com$/, /connect\.facebook\.net/],
    ['analytics', 'TikTok pixel', /analytics\.tiktok\.com$/, /analytics\.tiktok\.com/],
    ['session recording', 'Hotjar', /hotjar\.(com|io)$/, /static\.hotjar\.com/],
    ['session recording', 'Microsoft Clarity', /clarity\.ms$/, /clarity\.ms/],
    ['monitoring', 'Sentry', /sentry\.io$/, /ingest\.(us\.)?sentry\.io|sentry\.io/],
    ['monitoring', 'Datadog', /datadoghq\.(com|eu)$/, /browser-intake-datadoghq/],
    ['support', 'Intercom', /intercom(cdn)?\.(io|com)$/, /widget\.intercom\.io/],
    ['support', 'Crisp', /crisp\.chat$/, /client\.crisp\.chat/],
    ['support', 'Zendesk', /zdassets\.com$|zendesk\.com$/, /static\.zdassets\.com/],
  ]
  // A vendor rule that matches the service's own domain describes the service itself.
  const ownBase = location.hostname.split('.').slice(-2).join('.')
  for (const [layer, rawName, hostRe, codeRe] of RULES) {
    const h = hostRe && hostMatch(hostRe)
    const name = h && ownBase && h.endsWith(ownBase) && layer === 'model vendor' ? `${rawName} (this service's own API)` : rawName
    if (h) add(layer, name, 'direct', 'request', resources.find(u => u.includes(h)))
    const c = codeRe && findIn(codeRe)
    if (c) add(layer, name, 'indirect', c.source, c.snippet)
  }

  // Hosting from headers, builder from the generator meta tag.
  const H = [['Vercel', 'x-vercel-id'], ['Netlify', 'x-nf-request-id'], ['Cloudflare', 'cf-ray'], ['Fly.io', 'fly-request-id'], ['AWS CloudFront', 'x-amz-cf-id'], ['Render', 'rndr-id']]
  for (const [name, key] of H) if (headers[key]) add('hosting', name, 'indirect', `header ${key}`, headers[key])
  if (headers.server) add('hosting', `server: ${headers.server}`, 'indirect', 'header server', headers.server)
  if (headers['x-powered-by']) add('framework', `x-powered-by: ${headers['x-powered-by']}`, 'indirect', 'header x-powered-by', headers['x-powered-by'])
  if (metas.generator) add('builder', `generator: ${metas.generator}`, 'indirect', 'meta generator', metas.generator)
  if (globals.includes('__NEXT_DATA__') || window.next) add('framework', 'Next.js', 'indirect', 'global', 'window.__NEXT_DATA__ / window.next')
  if (window.__NUXT__) add('framework', 'Nuxt', 'indirect', 'global', 'window.__NUXT__')
  if (document.querySelector('[data-v-app], [data-v-]') || window.__VUE__) add('framework', 'Vue', 'indirect', 'DOM', 'data-v- attributes')
  const root = document.querySelector('#root, #__next, #app')
  if (root && Object.keys(root).some(k => k.startsWith('__react'))) add('framework', 'React', 'indirect', 'DOM', `${root.id} has React internals`)
  for (const k of storageKeys) {
    const m = /^sb-([a-z0-9]{20})-auth-token/.exec(k)
    if (m) add('backend', 'Supabase', 'indirect', 'storage key name', k)
  }

  // Supabase surface the client code names: tables, RPC, edge functions (names only).
  const supa = { tables: new Set(), rpc: new Set(), functions: new Set() }
  const NOT_TABLES = new Set(['utf8', 'base64', 'hex', 'binary', 'latin1', 'ascii', 'ucs2', 'utf16le'])
  if (tells.some(t => t.name === 'Supabase')) for (const { text } of texts) {
    for (const m of text.matchAll(/\.from\(\s*["'`]([a-z_][a-z0-9_]{1,40})["'`]\s*\)/g)) if (!NOT_TABLES.has(m[1])) supa.tables.add(m[1])
    for (const m of text.matchAll(/\.rpc\(\s*["'`]([a-z_][a-z0-9_]{1,60})["'`]/g)) supa.rpc.add(m[1])
    for (const m of text.matchAll(/functions\.invoke\(\s*["'`]([a-z0-9_-]{1,60})["'`]/g)) supa.functions.add(m[1])
    for (const m of text.matchAll(/functions\/v1\/([a-z0-9_-]{1,60})/g)) supa.functions.add(m[1])
  }

  // Model ids in code (indirect) and in request URLs (direct).
  // fal also serves partner models under the partner's own prefix (bytedance/…, xai/…, openai/…); those ids
  // look like the partner's API but are fal endpoints: confirm the host before naming the vendor.
  const MODEL = /\b(gpt-(?:4o|4\.1|5|image-[0-9])[a-z0-9.-]*|o[134]-(?:mini|pro|preview)|dall-e-3|claude-[a-z0-9.-]+|gemini-[a-z0-9.-]+|imagen-[0-9a-z.-]+|veo-?[0-9][a-z0-9.-]*|nano-banana[a-z0-9.-]*|fal-ai\/[a-z0-9._\/-]+|(?:bytedance|xai|openai|minimax|kling-ai|alibaba|wan)\/[a-z0-9._-]+(?:\/[a-z0-9._-]+)*|eleven_[a-z0-9_]+|(?:llama|qwen|mistral|mixtral|deepseek|grok)-[a-z0-9.-]+|flux[-.][a-z0-9.-]+|sdxl[a-z0-9.-]*|kling[-_][a-z0-9.-]+|seedance[-_][a-z0-9.-]+|seedream[-_][a-z0-9.-]+|hailuo[-_][a-z0-9.-]+|wan-?2\.[0-9][a-z0-9.-]*)\b/gi
  const models = {}
  const clean = id => id.toLowerCase().replace(/\.(jpe?g|png|webp|gif|avif|mp4|webm|svg|json|js|css)$/, '').replace(/[-._/]+$/, '')
  const ARTICLE = /guide|blog|tutorial|comprehensive|how-to|vs-|review/  // slugs of articles about a model
  for (const { source, text } of texts) for (const m of text.matchAll(MODEL)) {
    const id = clean(m[1])
    if (ARTICLE.test(id)) continue
    if (!models[id]) models[id] = { id, level: 'indirect', count: 0, first: source }
    models[id].count++
  }
  for (const u of resources) for (const m of u.matchAll(MODEL)) {
    if (/\.(jpe?g|png|webp|gif|avif|mp4|webm|svg)(\?|$)/i.test(u)) continue
    const id = clean(m[1])
    models[id] = { ...(models[id] || { id, count: 0, first: 'request' }), level: 'direct' }
  }

  // Secret-shaped strings: report type, place and a masked form only.
  const secrets = []
  const mask = s => s.slice(0, 6) + '…' + s.slice(-4)
  const SECRET = [['OpenAI-style secret key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g], ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/g], ['Stripe secret key', /\bsk_live_[0-9a-zA-Z]{20,}\b/g], ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/g]]
  for (const { source, text } of texts) {
    for (const [type, re] of SECRET) for (const m of text.matchAll(re)) {
      if (secrets.length < 20) secrets.push({ type, where: source, masked: mask(m[0]), note: type === 'Google API key' ? 'often public by design (Firebase, Maps); check its restrictions before calling it a finding' : 'should never ship to a browser' })
    }
    for (const m of text.matchAll(/\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g)) {
      try {
        const payload = JSON.parse(atob(m[0].split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
        if (payload.role === 'service_role') secrets.push({ type: 'Supabase service_role JWT', where: source, masked: mask(m[0]), note: 'bypasses row-level security; must never ship to a browser' })
      } catch {}
    }
  }

  const report = {
    url: location.href,
    measured: now,
    note: 'Browser-side view only. Server-side calls are invisible here; "not seen" is not "not used".',
    tells: tells.sort((a, b) => a.layer.localeCompare(b.layer) || (a.level === 'direct' ? -1 : 1)),
    models: Object.values(models).sort((a, b) => (a.level === 'direct' ? -1 : 1) || b.count - a.count).slice(0, 80),
    supabase: { tables: [...supa.tables].slice(0, 80), rpc: [...supa.rpc].slice(0, 80), functions: [...supa.functions].slice(0, 80) },
    secrets,
    requestHosts: [...hostsSeen].sort(),
    scannedScripts: texts.length - 1,
    cookieNames, storageKeys: storageKeys.slice(0, 60),
  }
  console.log(JSON.stringify(report, null, 2))
  return report
})()
