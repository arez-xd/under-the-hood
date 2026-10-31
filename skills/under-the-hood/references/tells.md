# Layer 3: which model and which agent run underneath

Why the buyer cares:

- **Someone else's model** means the price and quality follow that vendor, your inputs go to a third party, and the product can change overnight when the vendor does.
- **Its own model** means it matters what it was trained on, how it compares on your task, and what limits the results carry.
- **A no-code builder** means a young product that changes quickly; check how far it goes beyond the template.

## How to look

1. Open the service (with the user's account when there is one) and keep the browser's network log recording through one ordinary session: the main screen, one typical action, the result.
2. Run `scripts/stack-scan.js` in the page (paste into DevTools, or evaluate the file's text with a browser tool). It reads only what the page has already loaded — script and resource URLs, same-origin script text, meta tags, global objects, the names (never the values) of cookies and storage keys — and returns tells with a level and the evidence. Save it as `stack.json`.
3. Read the network log yourself: which hosts receive requests during the typical action. A request to a vendor host is the strongest tell there is. The responses the page loads by itself (prices, the model catalogue, plan data) can be read; requests of your own to those endpoints are out (SKILL.md, rule 1).
4. Read the docs and the API reference if the service has them: model names and versions, rate limits, "powered by" pages, sub-processor lists (layer 6).
5. For results you generated, run `scripts/media-meta.mjs` or `scripts/glb-inspect.mjs` (layer 4): metadata often names the generator.

## Levels

| Level | Means | Examples |
|---|---|---|
| **direct** | Seen happening, or stated by the company | a request to `fal.run` in the network log; the API returns `"model": "…"`; the docs say "we use X" |
| **indirect** | Present, not seen in use | `fal-ai/flux` strings in the bundle with no request seen; an asset path of a builder; a response header |
| **guess** | Inferred | the interface looks like a template; answers sound like a known model; the model says "I am GPT" |

A vendor or model is stated in the verdict only from a direct tell, or from an indirect one marked as such. Otherwise: "not established". The absence of vendor hosts in the browser proves nothing: the calls may be server-side.

Knowing the vendor is one question; knowing that the advertised model is the one serving your requests is another. For that, see `substitution.md`.

## Tell tables

Patterns as of October 2026. They change; record new ones you meet with the date, and treat every row as something to confirm on the service in front of you.

### Builder platforms

| Platform | Tells |
|---|---|
| Lovable | `lovable.app` / `lovableproject.com` hosts; `gpt-engineer-file-uploads` in asset or Open Graph image paths; a `lovable` editor bridge in the bundle |
| Base44 | `base44.app` hosts; `@base44/sdk` in the bundle |
| Replit | `.replit.app` or `.repl.co` hosts |
| Bolt | `bolt.new` or `bolt.host` references; deployed on Netlify more often than not |
| Framer | `framerusercontent.com` assets; `<meta name="generator" content="Framer …">` |
| Webflow | `data-wf-site` / `data-wf-page` attributes; `website-files.com` assets; generator meta |
| Wix | `static.wixstatic.com`, `parastorage.com` |
| Squarespace | `static1.squarespace.com` |
| Bubble | `bubble.io` scripts; `/package/run_js` paths |
| FlutterFlow, Flutter web | `main.dart.js`, `flutter.js`, a `flt-` element tree |

### Framework and hosting

| What | Tells |
|---|---|
| Next.js | `__NEXT_DATA__` or `self.__next_f`; `/_next/static/` |
| Nuxt | `__NUXT__`; `/_nuxt/` |
| SvelteKit | `__sveltekit_*`; `/_app/immutable/` |
| Remix | `__remixContext` |
| Astro | `astro-island` elements |
| Angular | an `ng-version` attribute |
| Vue | `data-v-` attributes; `__VUE__` |
| React (other) | `__reactContainer`/`__reactFiber` keys on DOM nodes; Vite builds as `/assets/index-<hash>.js` |
| Vercel | `x-vercel-id` header, `server: Vercel` |
| Netlify | `x-nf-request-id`, `server: Netlify` |
| Cloudflare | `cf-ray`, `server: cloudflare` |
| Fly.io | `fly-request-id` |
| AWS CloudFront | `x-amz-cf-id` |

### Backend and auth

| What | Tells |
|---|---|
| Supabase | `<ref>.supabase.co` in requests or code; a `sb-<ref>-auth-token` storage key. Table names, RPC names (`rpc/…`) and edge functions (`functions/v1/…`) appear in the client code |
| Firebase | `firebaseapp.com`, `firestore.googleapis.com`, `identitytoolkit.googleapis.com`; a config object with `apiKey` and `authDomain` (public by design) |
| Convex | `convex.cloud` |
| Appwrite | `appwrite` endpoints |
| Clerk | `clerk.accounts.dev` or a `clerk.` subdomain; `__clerk` |
| Auth0 | `auth0.com` |

### Model vendors

Hosts receive requests (direct when seen in the log); model ids and SDK names sit in code (indirect).

| Vendor | Hosts | In code |
|---|---|---|
| OpenAI | `api.openai.com`; result images on `oaidalleapiprodscus.blob.core.windows.net` | `gpt-4o`, `gpt-4.1`, `gpt-5`, `o3`, `gpt-image-1`, `dall-e-3` |
| Anthropic | `api.anthropic.com` | `claude-` ids |
| Google | `generativelanguage.googleapis.com`, `aiplatform.googleapis.com` | `gemini-`, `imagen-`, `veo-` |
| fal | `fal.run`, `queue.fal.run`, results on `fal.media` | `fal-ai/<model>` ids; partner models under the partner's prefix (`bytedance/seedance-…`, `xai/…`, `openai/…`) are fal endpoints too: read the host or the catalogue's links before naming the vendor |
| Replicate | `api.replicate.com`, results on `replicate.delivery` | `owner/model:version` ids |
| OpenRouter | `openrouter.ai/api` | `vendor/model` ids |
| Together, Groq, Fireworks | `api.together.xyz`, `api.groq.com`, `api.fireworks.ai` | open-model ids (`llama-`, `qwen`, `mistral`, `deepseek`) |
| Mistral, DeepSeek, xAI | `api.mistral.ai`, `api.deepseek.com`, `api.x.ai` | `mistral-`, `deepseek-`, `grok-` |
| ElevenLabs | `api.elevenlabs.io` | `eleven_` model ids |
| Runway, Luma, Kling | `api.runwayml.com` / `api.dev.runwayml.com`, `api.lumalabs.ai`, Kling endpoints | `gen-`, `ray-`, `kling-` |
| Stability, Black Forest Labs, Ideogram | `api.stability.ai`, `api.bfl.ai`, `api.ideogram.ai` | `sdxl`, `sd3`, `flux`, `ideogram` |
| 3D vendors | `api.meshy.ai`, `api.tripo3d.ai` | their model and task names |

### Own models

A service that trains its own model usually shows it: model names and versions in its API reference and changelog, a research page or model card, its own task queue (`/v2/text-to-3d`, job ids, polling) with parameters no known vendor exposes. None of these is proof alone. Write what you saw and the level; "own model" is stated only when the company states it (direct) and nothing in the log contradicts it.

### Agents and assistants

For a chat assistant or an "AI employee", establish:

- **the model:** from the docs, an API response, a model picker, or vendor hosts. A model naming itself in chat is a guess: models are often wrong about what they are;
- **the tools it really calls:** web search, a browser, code execution, file reading. Visible as requests, tool-call events in the stream, or steps in the interface. An agent that says it searched with no request seen gets status *claimed, not observed*;
- **memory:** what persists between sessions (ask in a new session about something said in an old one);
- **orchestration and observability services** sometimes visible in code: LangSmith (`smith.langchain.com`), Langfuse, Helicone, Portkey (indirect).

### Payments, analytics, support

| What | Tells |
|---|---|
| Stripe | `js.stripe.com`, `checkout.stripe.com`, `buy.stripe.com` |
| Paddle | `cdn.paddle.com` |
| Lemon Squeezy | `lemonsqueezy.com` scripts |
| Polar, Gumroad | `polar.sh`, `gumroad.com` |
| Chargebee, Solidgate | `js.chargebee.com`; `solidgate` |
| PostHog, Amplitude, Mixpanel | `i.posthog.com`; `amplitude.com`; `mixpanel.com` |
| Google Analytics, Tag Manager | `googletagmanager.com/gtag/js?id=G-…`, `GTM-…` |
| Meta, TikTok pixels | `connect.facebook.net`, `analytics.tiktok.com` |
| Hotjar, Clarity | `hotjar.com`, `clarity.ms` (session recording: your screen may be recorded) |
| Sentry, Datadog | `sentry.io`, `datadoghq` |
| Intercom, Crisp, Zendesk | `intercom.io`, `crisp.chat`, `zdassets.com` |

## Mobile apps

A native app has no page to scan, but the hosts it talks to can still be seen, which is the strongest tell anyway.

- **iOS App Privacy Report** (Settings → Privacy & Security → App Privacy Report, turn it on, use the app for a session, wait a minute). It lists every domain the app contacted, per app, for the last seven days. Built into iOS, nothing to install. A vendor domain here is **direct**.
- **Android:** Settings → Privacy → Privacy dashboard shows permissions used; for domains, a local VPN-based logger the user trusts, or a proxy (below).
- **A proxy on the user's own computer** (mitmproxy, Proxyman, Charles) with the user's phone pointed at it shows hosts and, after installing and trusting the proxy's certificate on the phone, the requests. Apps that pin certificates won't decrypt: record the hosts and stop there. Getting around pinning (jailbreak, hooking tools) is out of scope.
- **The store page:** the App Store privacy label ("Data Used to Track You", "Data Linked to You"), the developer and seller names (layer 2), the in-app purchase list with prices (layer 5), version history (layer 2), and the support and privacy-policy links.
- **Results** made in the app go through `media-meta.mjs` and `glb-inspect.mjs` like any other.

The app binary itself is not taken apart: downloading and unpacking it goes past what an ordinary user does.

## Secrets in shipped code

`stack-scan.js` flags strings shaped like secret keys (`sk-…`, `AKIA…`, a JWT whose role is `service_role`) and prints them masked. Record the type and the file; never use one. A Supabase anon key or a Firebase `apiKey` is public by design and is not a finding.
