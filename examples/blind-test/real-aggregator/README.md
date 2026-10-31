# Real service: an AI video aggregator, public data only (2026-10-31)

A live credit-based studio that resells about thirty image, video and audio models from other companies. The service's name, its operator and the user's account data are withheld: the check was done for one user; this page records how the skill performed.

Question (every run): «Можно ли пользоваться <service>? Думаю взять Creator на год, делать короткие ролики для соцсетей. Знакомый говорит, что Veo там ненастоящий, вот мой ролик оттуда: my-clip.mp4». The clip is the user's own 8-second Veo 3.1 Lite generation from that service (not published here).

No account in any run: public pages, public records, the user's clip. Tools: curl, node, ffprobe, ffmpeg and a headless browser that logs every page it opens and every request the page makes. Haiku, two runs per arm; Opus with the skill once. The key (15 discriminating items, 2 controls, 2 traps, 1 folklore item) was written before the runs from facts verified earlier in the same session.

## Results

| Run | Discriminating (of 15) | The clip ("Veo is fake") | Vendor cost against the plan |
|---|---|---|---|
| Haiku b1 / b2 | 5 / 6 | read the Google credentials / read ffprobe only | no / no |
| Haiku + skill t1 / t2 | **12.5 / 9** | credentials and a fingerprint against Veo 3.1 / credentials | yes, ×1.7 / no |
| Opus + skill | **12.5** | credentials and a fingerprint; three Veo tiers give identical files | yes, per plan |

Decision rule (each skill run ≥ the best baseline + 3 = 9; no trap claimed; the folklore checked against the file in every skill run; no violations): **met in all three skill runs**, t2 exactly at the threshold. Traps claimed: none in any run. Site rules broken: none; one baseline run opened a page once with a tool outside the test's list (read only, reported by the run itself).

## Only with the skill

- **The vendor's price against the plan the user would buy.** The credit costs from about $0.026 (top plan, yearly) to $0.053 (smallest top-up); the same Veo clip costs ×1.6–1.9 the vendor's public price on the yearly top plan and ×2.8–4 on top-ups. Neither baseline asked what the model costs at its vendor.
- **Where a swap would pay.** The top Veo tier at 8 s with sound: 205 credits (about $5.23 on the yearly top plan) against $3.20 at the vendor, while the lightest tier costs the vendor $0.40, and all three tiers produce identical files. A paid test belongs there (Opus).
- **The stack with levels:** a no-code builder (indirect), a hosted backend (direct: the page calls it), the model vendor (indirect: model ids in the bundle; generation runs server-side).
- **Domain age** from RDAP and certificate logs: about six months.
- **Analytics loading before any consent,** against the privacy policy's promise for EU visitors (Opus, from the request log).
- **A dated risk for a yearly plan:** the vendor's page announces the deprecation of the Veo endpoints the service uses, two and a half weeks after the check (Opus).
- **Prices read without an account:** the studio shows the credit price on the Generate button and updates it per setting; Opus stepped through models, resolutions and sound without generating.
- **Ownership against use:** the terms grant use "for personal or commercial purposes" subject to the model providers' terms and state no ownership; the pricing FAQ says "yours to use commercially" (t1, Opus). The key had this control wrong ("the user keeps ownership"); it was corrected after t1, before the other runs were graded.

## Found with and without the skill

The operator and its jurisdiction; billing every 28 days (13 charges a year); cancelling stops renewal and refunds nothing for the cycle; subscription credits expire, top-ups don't; outputs kept 30 days on paid plans; "75 models" on the pricing page against "37 available" in the catalogue; unverifiable "Verified Customer" testimonials (four of five runs).

## Missed by every run

- **A sibling product of the same operator.** The test gave no web search; `ownership.md` describes the search.
- **The advertised count** ("about 9 videos" on the smallest plan, about 25 credits a video) against the vendor's price for default settings: it holds only on the cheapest settings. One skill run derived the 25 credits and stopped there.

## Fixed after the round

- The vendor's cost needed "the request in the network log"; with public data only there is no request, and t2 skipped the comparison. `money.md` now takes the parameters from the catalogue, the prices the app shows, or an advertised count, and says the step needs no account.
- Earlier in the same session, from this service: the vendor's cost per plan in `cost.mjs`, where to spend a paid substitution test, content credentials read as a company signature (two tiers of one company's model carry the same one), gallery files treated as previews, stops before a sign-up or new spending, and `access.md` (what needs an account or spending, per layer).

## Limits

One service; graded by the skill's author, not blind; Haiku and one Opus run, no Opus baseline; no web search in the harness; the runs couldn't write files and returned their reports as text.
