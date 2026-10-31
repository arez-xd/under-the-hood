# What needs an account or spending

A lookup for the stops in SKILL.md § 0: what each layer can check with public data only, with a free account and with a paid plan. Use it to word a stop (which question the next step answers) and the report's open questions (what would answer each). The check itself follows the layers; this file doesn't set its order.

## Public data: no account

| Layer | What can be checked |
|---|---|
| 1 Promise | every claim on the landing page, pricing, FAQ, help centre, app store pages, demo videos, public ad libraries; advertised counts ("about 9 videos") against the prices; discount timers and "today only" offers (reload the page) |
| 2 Ownership | the legal entity in the terms and privacy policy, company registries, domain age (RDAP), sibling products of the same company, leftovers of other products, public reviews (app stores, forums), testimonials and whether they can be traced |
| 3 Stack | builder, framework, hosting, backend, payments, analytics from the HTML and bundle (`stack-scan.js`); model and vendor ids in the bundle (indirect); requests the public pages make; routes listed in the bundle (recorded, never opened); keys shipped in code (a finding, masked) |
| 4 Reality | public docs and API reference, changelog, status page; the gallery as previews only (`substitution.md`, Content credentials); files the user already has from the service (`media-meta.mjs`, `fingerprint.mjs`) |
| 5 Money | plans, billing cycle (28 days means 13 charges a year), the credit price on each plan and top-up, credit expiry, the vendor's public price for the same action and the markup per plan (`cost.mjs`) |
| 6 Rights and data | terms, privacy, refund and billing policies quoted (`terms.mjs`); trackers loading before consent; sub-processors; the cancellation and refund route as written |

Open after Public: the model list and prices inside the app (some studios show them without an account), what one generation returns, retention of real results, how cancelling works in practice.

## Free account: the user's own ordinary sign-up

Everything above, plus:

| Layer | What can be checked |
|---|---|
| 1 Promise | the sign-up flow: data asked for, a card required for "free", plans or add-ons preselected, marketing consent preticked; claims inside the app against the landing page |
| 3 Stack | the model picker: which models are offered and locked; model ids in the requests the app sends (network log, direct for the request); the vendor's delivery domain of results; the assistant's model field in its response (one question) |
| 4 Reality | the free credits or free generations: one run on default settings, measured against the advertised spec, its metadata and watermark; features listed on the landing page that are missing or "coming soon" in the app |
| 5 Money | the price the app shows for each setting before generating (step through length, resolution, sound, model without pressing Generate); where the thin margins are; free credits and their expiry |
| 6 Rights and data | the user's library: are old results still there past the stated retention, are results public or private by default, export formats, how long download links live; where cancelling and deleting the account are in the settings, and how many steps |

Open after Free account: quality on the user's own task, the real cost per usable result, whether the paid model is the one advertised, paid-only features.

## Paid: a trial or a plan, with a budget agreed first

At the stop, write the plan: which generations, how many, on which settings, the credits and the money; get a yes. Using what a plan already includes is ordinary use; new spending (a plan, top-ups, paid runs at a vendor) is the user's decision.

| Layer | What can be checked |
|---|---|
| 4 Reality | the test set from `task.md` against the bar written before the run; attempts per usable result; paid-only features (resolution, length, watermark removal, commercial license) as delivered |
| 3 Stack | the substitution check (`substitution.md`): runs on the settings with the thinnest margin, references at the vendor, `fingerprint.mjs` |
| 5 Money | the credits actually deducted against the price shown; failed generations refunded or not; the real cost per usable result (`cost.mjs` with measured attempts); the charge on the statement against the advertised price, taxes included |
| 6 Rights and data | cancelling in practice (the user does it, the check records the steps and what remains after the cycle ends) |

Still open after Paid: what happens on the server, the company's real costs and intentions. Those are questions for the service, written down in the report.
