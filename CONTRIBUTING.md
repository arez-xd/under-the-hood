# Contributing

Thanks for helping. The skill is useful when its tells are current, its scripts measure correctly and its rules hold up on real services. Contributions in that order help most.

## What helps

- **A new or changed tell.** A builder, backend, model host, payment or analytics service the tables in `references/tells.md` don't know, or a pattern that changed. Open an issue with the "new tell" template: the hosts, strings or headers, whether the tell is direct or indirect, where the vendor documents it, and the date you saw it.
- **A script fix.** A wrong measurement, a crash on an awkward input, a format the parser misses. Add a small synthetic fixture and a test that fails before the fix.
- **A category profile.** A kind of service the profiles don't cover yet (voice, music, coding agents), with what to measure and how.
- **A rule that misfired.** A run where the skill sent the agent the wrong way. Describe the run; changes to `SKILL.md` rules are rerun on a blind-test target before they merge.

## Ground rules

- **Method only.** Examples, fixtures and tests use made-up services or your own products. No real company's findings, names, prices tied to a named service, keys, tokens or personal data.
- **Read-only stays read-only.** No step may call endpoints found in shipped code, enumerate IDs, open admin routes, use keys found in a bundle or get around limits. A shipped secret is recorded as a finding, masked, and left alone.
- **Every rule says how to check it:** a script, a measurement, a quote with its clause. A rule without a check is a slogan.
- **Every tell carries a level and a date.** Tells age; write down when it was true.
- **Write what was observed.** Statements of fact with their evidence; motives and accusations stay out.

## Development

Node.js 18 or newer, no dependencies.

```bash
npm test          # node --test tests/*.test.mjs
npm run check     # node --check on every script
```

Scripts follow the same conventions: `--help` prints usage; exit 0 when done, 1 on bad input or a finding, 2 on a usage error; they read local files only, except `terms.mjs` (plain GET of the URLs given) and `stack-scan.js` (runs in the page and reads what the page already loaded). Keep them dependency-free and readable.

Binary fixtures are generated in the tests (`tests/helpers.mjs` builds a C2PA-signed PNG and a GLB) so the repository carries no third-party media.

## Pull requests

Fill in the checklist in the template. Keep one change per pull request, with a line in `CHANGELOG.md` under an "Unreleased" heading.
