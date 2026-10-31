# Layer 7: the verdict for the task

One page the user can decide from. Fill `templates/report.md`; the decision comes first.

## Contents

1. **Decision:** use / use with conditions (which) / don't use, and the reason in two sentences.
2. **What it really is,** in one sentence: "A credit-based studio over 13 model families from one vendor, built on a no-code platform, with its own project library."
3. **What runs underneath,** each line with its level: "Image and video models via fal (direct: requests to `queue.fal.run`)"; "Chat via OpenAI (indirect: `gpt-4o` in the bundle, no request seen)".
4. **Advertising:** what held up, what didn't, with the claim numbers from `claims.md`.
5. **The test set:** results per input against the bar in `task.md`.
6. **Money:** the user's month, hidden costs, how to leave.
7. **Rights and data:** what the user may do with results, where inputs go, training, lock-in.
8. **What it adds** on top of other companies' models, when it uses them. Judge it by what it adds: one bill, a library, workflows across models, a better interface.
9. **Ask before paying:** questions for support or the vendor, each tied to a gap (a claim not checkable, a term that is unclear, a plan that wasn't tested).
10. **Date and limits:** when the check was done, the access the check had, what wasn't checked and why, and what would answer it (an account, which paid runs).

## Compare mode

A table, services as columns, the ten points as rows, the same test set for all. End with a recommendation for the task and the condition that would change it ("if you need commercial rights on the free plan, B; otherwise A").

## Before handing over

Run `node scripts/claims-check.mjs <run folder>`. It checks that every claim has a status, evidence and a date, that "works" always has evidence, and that every model or vendor named in the report's verdict carries a level (`direct` or `indirect`). A guess named as a vendor fails the check.

## Publishing

The report is written for the user's decision. If they want to publish it:

- say plainly that publishing a review of a company carries legal and reputational risk, and that the skill's rules (observations only, evidence, dates, levels) reduce it without removing it;
- remove personal data, secrets (even masked), and anything that tells a reader how to harm the service (endpoints, admin routes, IDs);
- keep the date and the "not checked" section;
- recommend sending the findings to the company first and giving it time to answer.
