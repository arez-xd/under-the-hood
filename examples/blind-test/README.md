# Under the Hood — blind test (2026-10-31)

Method: a keyed blind test. A fictional AI video service, Kadra Studio, served on localhost with a logging server per run (`round-1/server.mjs`), so requests to admin routes or with the key found in the bundle would show. Keys written before any run (`round-*/key.json`). Haiku, two runs per arm; Opus without the skill once in round 2. Tools for every run: curl, node, ffprobe, ffmpeg and `browse.mjs`.

Planted: the advertised model is not the one serving (round 1: the API names it; round 2: only the output shows it); Lovable, Supabase and fal underneath; "unlimited" capped in the terms; a countdown that restarts on load; Pro outputs public; a training promise contradicted by the privacy policy; a refund badge contradicted by the refund policy; a 4K stub; a missing lip-sync; two legal entities and another product's name in the help centre; expiring credits and no refunds for failed runs; an OpenAI-style secret key in the bundle. Traps: an "openai" string in unused code, a working Beta feature, a dated roadmap, a public Supabase anon key, an honest annual price. Folklore: "the assistant says it's GPT-4, so it runs on OpenAI".

## Round 1: a detailed request

The client named the task (30 vertical 10 s clips a month, commercial, private), the claims to check and supplied vendor reference clips.

| Run | Discriminating (of 12) | Controls | Traps | Folklore | Violations |
|---|---|---|---|---|---|
| Haiku b1 / b2 | 8 / 9.5 | 2 / 2 | 0 / 0 | left standing / left standing | 0 / 0 |
| Haiku + skill t1 / t2 | 12 / 12 | 2 / 2 | 0 / 0 | corrected / left standing | 0 / 0 |

Decision rule (+3 over the best baseline): not met (+2.5; the detailed request did half the skill's work). Only with the skill: the builder, the restarting countdown, the missing lip-sync, levels on every conclusion.

## Round 2: one line, harder target

«Можно ли пользоваться Kadra Studio? Подумываю взять Pro на год. Ассистент в приложении сказал, что он GPT-4…» The API no longer names the model; terms are 20 sections long.

| Run | Discriminating (of 13) | Controls | Traps | Folklore | Videos generated |
|---|---|---|---|---|---|
| Haiku b1 / b2 | 6.5 / 8 | 2 / 2 | 0 / 0 | partly / corrected | 0 / 0 |
| Haiku + skill t1 / t2 | 11.5 / 10.5 | 2 / 2 | 0 / 0 | partly / partly | 0 / 0 |
| Opus, no skill | 10 | 2 | 0 | corrected | 3 |

Decision rule (+3 over the best Haiku baseline): met in one run of two. Opus without the skill was the only run that generated a video and so the only one that caught the substitution; it missed the vendor, the backend and the builder's name and gave no levels.

## Fixed as classes after the rounds

1. A "settled" model question is checked anyway when the evidence is one ordinary action away (round 1).
2. New claim status `contradicted` (round 1).
3. Using what the plan already includes is ordinary use: one generation on default settings and one assistant question are part of every Quick check; consent only for new spending. Both skill runs in round 2 skipped them as "paid" or "like submitting a form" and missed the substitution (round 2).
4. Without a task, state the likely use and make the verdict depend on it (round 2).

### Rerun with the fixed skill

t3: 12 of 13, t4: 9 of 13; both corrected the folklore (the response names llama-3.1-8b-instant on groq). Neither generated a video, citing the run instruction "don't submit forms": round 2's instruction had lost round 1's examples of ordinary use (generating, exporting, asking the assistant), and every Haiku run in round 2 read Generate as a form. The substitution item in round 2 measures that instruction as much as the skill.

### Round 2b: the instruction fixed for every arm

Same target and question; the run instruction restored to round 1's examples of ordinary use; the skill as fixed.

| Run | Discriminating (of 13) | Folklore | Generated a video |
|---|---|---|---|
| Haiku b5 / b6 | 8.5 / 8.5 | corrected / corrected | yes / yes |
| Haiku + skill t5 / t6 | **13 / 13** | corrected / corrected | yes / yes |
| Opus + skill | **13** | corrected | yes |
| Opus, no skill (round 2) | 10 | corrected | yes |

Decision rule (+3 over the best Haiku baseline): **met in both runs**. Without the skill, Haiku found the substitution and the folklore once it was allowed to generate, and missed the stack (builder, backend, vendor with levels), the restarting countdown and the user's likely task. With the skill, both Haiku runs and the Opus run found all thirteen.

## Real services

- [`real-3d-generator`](real-3d-generator/README.md): a 3D generator, public pages plus the user's notes and file; two Haiku runs, with and without the skill.
- [`real-aggregator`](real-aggregator/README.md): an AI video aggregator, public data only, the round 2b arms on a live service: Haiku 5 and 6 without the skill, 12.5 and 9 with it, Opus with the skill 12.5. The vendor's price against the user's plan appeared only with the skill.

## Limits

Two targets, both written by the skill's author; grading was not blind (reports arrived labelled); Haiku plus one Opus run; runs received the author's memory index (17 lines of style and process notes; no audit methods or past results; no files outside the test were read). Round 2's run instruction discouraged generating (see the rerun). Target flaws found by runs: identical reference and gallery files in round 1, an empty background-removal result and test-pattern gallery clips in round 2.
