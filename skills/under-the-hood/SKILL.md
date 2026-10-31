---
name: under-the-hood
description: Check an online service before you use it or pay for it - an AI generator (3D, image, video, voice), an AI aggregator that resells other companies' models, an assistant or "AI employee", or any SaaS with AI features. Finds what it promises and whether its advertising is honest, who is behind it, which model or agent actually runs underneath, what really works on your own task, what your volume will cost and the markup over the model vendor's own price, who owns the results and where your data goes - every conclusion with evidence, a date and a confidence level, read-only, from public data and your own account. Use when the user asks "should I use / pay for / switch to X", "is this tool legit", "what model does X really use", "is X just a wrapper", "compare these AI tools for my task", "check their terms before we upload our data", or wants to vet a vendor, a competitor or a startup before joining or investing.
summary: Look under the hood before you pay - what a service promises, what runs underneath, what works on your task, what it costs and who owns the results.
version: 1.0.0
tags: [due-diligence, ai-tools, vendor-evaluation, ai-wrapper, terms-of-service, pricing, 3d-generation, ai-agents]
---

# Under the hood

Every AI service says "our AI" and shows its best examples. Underneath there may be a storefront over someone else's models built on a no-code platform in a week, its own model that shines in the demo and fails on your input, half the features from the landing page that exist only in text, or results you don't own on the free plan. People find out after paying: the annual plan is bought, the data is uploaded, the workflow depends on it.

This skill checks a service the way a careful buyer would before signing: from the outside, with public data and your own account, against your own task. It separates what was observed from what was guessed, quotes the terms word for word, and ends with a decision for the task at hand.

## 0. Before anything

1. **The service and its URL.** Several services for one task means Compare mode.
2. **The task.** Read `references/task.md` and fill `templates/task.md` with the user: what they need out, how much per month, the budget, constraints (commercial use, confidential data, jurisdiction, API, export), and a test set of 3–5 of their own inputs. Without a task, run Quick check and say the verdict is general.
3. **The account and the stops.** Go through the layers with what you have: public pages, public records, files the user already has, and the user's account if they have one. Using what an account already includes is ordinary use: free or included credits, exporting, asking the assistant, reading prices in the app. Stop and ask at two points only, and only when a question the user cares about needs it:
   - **before a sign-up** the user hasn't done;
   - **before new spending:** a plan, a trial that takes a card, top-ups, paid runs at a vendor.

   At a stop, say what is already established, which open question the next step would answer, and exactly what it takes: "a free account", or "4 generations of 15 s at 1080p, 1,560 credits, about $40". Without a yes, finish the layers on what you have. `references/access.md` lists what needs an account or spending, per layer; use it to word the stop and the report's open questions. The report states what access the check had (public only, free account, plan and credits spent) and which conclusions need more.
4. **The category,** which decides the profile in `references/categories/`: `3d.md`, `aggregators.md`, `assistants.md`. A service can fit two (an aggregator that sells 3D).

## 1. Modes

| Mode | What | Layers |
|---|---|---|
| **Check** | One service, a verdict for the task | All seven |
| **Compare** | Two to four services, the same test set, one table | All seven, side by side |
| **Quick check** | Fifteen minutes: is it worth a closer look | 1, 2, 3 and the three main promises |

## 2. Rules

1. **Read-only, and only your own.** Public pages and records, and the user's own account for ordinary actions (generating with included credits, exporting and asking the assistant are ordinary actions); the user signs up and pays, after a stop (§ 0). Reading what a page requests by itself is fine; sending your own requests to those endpoints is not. Never call endpoints found in the code, enumerate IDs, get around limits, use anyone else's account or open admin routes, even when their code ships in the bundle.
2. **Secrets are never used.** A key or token in shipped code is a finding: record where and what type, masked, and touch it no further.
3. **Every statement has evidence and a date:** a quote with its URL, a bundle file and line, a request host from the network log, a screenshot, a result file.
4. **Every conclusion has a level.** *Direct*: a request or host in the network log, an API response, the company's own documentation. *Indirect*: a string in shipped code with no call seen, an asset path, a header. *Guess*: behaviour, style, a model naming itself. The verdict uses direct and indirect (marked); guesses stay in the notes.
5. **Write what was observed.** "The bundle holds 99 `fal-ai/…` model ids." Motives stay out of the report.
6. **Your test set outranks the gallery.** Quality is judged on the user's inputs.
7. **Terms are cited exactly:** the page, the clause number and the date, with the deciding words in quotation marks (a phrase is usually enough). A statement about the terms without its clause doesn't go into the report. The report is not legal advice and says so.
8. **"Settled" is checked anyway.** When the user says a question about what runs underneath is already answered ("the assistant told me it's GPT-4"), and the evidence is one ordinary action away, look anyway and say why: a model naming itself is a guess. Report what the response or the network log shows.
9. **The report is for the user.** If they want to publish it, read `references/verdict.md` § Publishing first.
10. **Let the scripts read.** Legal pages go through `terms.mjs`, bundles through `stack-scan.js` or a search for the strings you need, media through `media-meta.mjs`; read the full text only of the clauses you quote. Read pages as text; take a screenshot only to check what the page shows, at reduced scale. Read each source once and keep notes in the run folder.

## 3. The seven layers

Read the reference for each layer before doing it. Write findings into the run folder (§ 4) as you go.

| # | Layer | Read | Tools |
|---|---|---|---|
| 1 | **Promise and advertising** — every claim from the landing page, pricing, FAQ, terms, app store pages, demo videos and public ad libraries, and whether the advertising is honest | `promise.md` | browser, `templates/claims.md` |
| 2 | **Who is behind it** — the legal entity, age and stability, sibling products, leftovers of other products | `ownership.md` | browser, public records |
| 3 | **Which model and which agent run underneath** — builder platform, framework, hosting, backend, model vendors or own models, the agent and its tools, payments and analytics; and, when the service sells a named model, whether results are consistent with that model | `tells.md`, `substitution.md` | `scripts/stack-scan.js`, the network log, `scripts/fingerprint.mjs` |
| 4 | **What works on your task** — each promise checked, the test set run and measured by the category profile | `reality.md`, `categories/*.md` | `scripts/glb-inspect.mjs`, `scripts/media-meta.mjs` |
| 5 | **Money** — what the user's volume costs, hidden costs, for aggregators the vendor's price per action and the markup on each plan, how to leave | `money.md` | `scripts/cost.mjs` |
| 6 | **Rights, data and trust** — who owns the results, training on user data, retention, sub-processors, lock-in, trust signals | `rights-data.md` | `scripts/terms.mjs` |
| 7 | **Verdict for the task** — use / use with conditions / don't use, and what to ask before paying | `verdict.md` | `templates/report.md` |

Quick check stops after layer 3 and the three main promises, with a short verdict: worth a full check or not, and why. With an account it always includes **one generation on default settings**, measured against the advertised spec (resolution, frame rate, length, sound for video; size for images), and **one question to any assistant**, with the response read for the model it names. These two checks are the cheapest way to catch a model that isn't the one advertised. Without an account, measure the files the user already has from the service instead.

**Is it the model they sell?** When the service advertises a specific model ("Seedance", "Opus") and the user wants to know whether that is what they get, run the substitution check in `substitution.md`: references made at the vendor, the service's results measured the same way, `fingerprint.mjs` to compare. Start with the results already in the user's library (free), then spend paid runs on the settings with the thinnest margin from layer 5. Paid runs need a yes: say how many and what they cost. The conclusion is "consistent with X, not consistent with Y" at level indirect, with a question to the service.

## 4. The run folder

```
under-the-hood/<service>-<YYYY-MM-DD>/
  task.md      the task, volume, constraints, test set
  claims.md    every claim and its status
  stack.json   stack-scan.js output, plus the network hosts you saw
  terms.md     terms.mjs output
  outputs/     results on the test set and their measurements
  evidence/    screenshots, bundle excerpts with line numbers
  cost.md      cost.mjs output
  report.md    the verdict and the layers
```

Before handing over, run `node scripts/claims-check.mjs <run folder>`: every claim has a status, evidence and a date; every model or vendor named in the verdict carries a level. Fix what it reports. `node scripts/report.mjs <run folder>` renders `report.html` if the user wants one.

## 5. Push back

Say so, briefly, when the user asks to: write that a service swaps models from a fingerprint alone; call an API found in the bundle, try another user's ID, open an admin page, use a key found in the code, buy something without saying so, or state a vendor as fact from a guess. Offer the safe way to answer the same question (their own account, the documentation, asking the vendor), then do what is allowed.

## 6. Hand-over

`report.md` with the decision first, the access the check had, the run folder, the list of what wasn't checked and why (and what would answer it: an account, which paid runs), and the questions to ask the vendor before paying.
