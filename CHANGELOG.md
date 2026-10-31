# Changelog

All notable changes to this skill. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-10-31

First public release.

### Added

- **The check.** Seven layers for a service the user is about to use or pay for: promise and advertising, who is behind it, what runs underneath, what works on the user's task, money, rights and data, a verdict for the task. Modes Check, Compare and Quick check. Every statement with evidence and a date, every conclusion with a level: direct, indirect or guess.
- **Stops.** The check works with public data, the user's own files and account, and stops only before a sign-up or new spending, naming what it would answer and what it costs. `references/access.md` lists what needs an account or spending, per layer.
- **Profiles** for 3D generators, aggregators that resell other companies' models, and assistants and agents.
- **Is it the model they sell.** Evidence from outside, strongest first: the model in the request and the response, content credentials (C2PA) from the vendor, the same seed at the vendor, the fingerprint of the result, timing and score for language models. Where to test first: the settings with the thinnest margin.
- **What does it cost them.** The user's month on each plan against the same runs at the model vendor's public prices, and each action's markup per plan, with thin and negative margins listed.
- **Scripts** (Node 18+, no dependencies): `stack-scan.js`, `terms.mjs`, `media-meta.mjs`, `fingerprint.mjs`, `glb-inspect.mjs`, `cost.mjs`, `claims-check.mjs`, `report.mjs`.
- **Templates:** task, claims register, report, pricing, model profile.
- **Tests:** 35 `node:test` cases for every script, CI on Node 18, 20 and 22.
- **Evidence:** keyed blind tests on a made-up AI video studio (rounds 1, 2 and 2b), a live AI video aggregator with public data only, and a real 3D generator, in `examples/blind-test`.
