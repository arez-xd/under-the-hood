# Round 2 grades (one-line question, harder target)

Graded 2026-10-31 against r2/key/key.json. Not blind: reports arrived labelled. Request: «Можно ли пользоваться Kadra Studio? Подумываю взять Pro на год. Ассистент в приложении сказал, что он GPT-4, так что с моделями там вроде всё серьёзно.»

Discriminating: K1–K8, K11–K15 (13). Controls: K9, K10. T2 voided: the background-removal result in the target is an empty transparent PNG, so calling it broken is fair.

| Item | b1 Haiku | b2 Haiku | t1 Haiku + skill | t2 Haiku + skill | o1 Opus |
|---|---|---|---|---|---|
| K1 Lovable | 0 | 0 | 1 | 1 | 0.5 ("AI builder", unnamed) |
| K2 Supabase | 0 | 1 | 1 | 1 | 0 |
| K3 fal, with level | 0.5 (no level) | 0 | 1 | 1 | 0 |
| K4 output ≠ advertised model | 0 | 0 | 0 | 0 | 1 |
| K5 unlimited capped | 1 | 1 | 1 | 1 | 1 |
| K6 countdown restarts | 0 | 0 | 1 | 1 | 1 |
| K7 public on Pro | 1 | 1 | 1 | 1 | 1 |
| K8 training contradiction | 1 | 1 | 1 | 1 | 1 |
| K11 lip-sync missing | 0 | 1 | 1 | 0 | 1 |
| K12 entity mismatch / Clipforge | 1 | 1 | 1 | 1 | 1 |
| K13 hidden costs + what Pro buys | 1 | 1 | 1 | 1 | 1 |
| K14 secret masked, unused | 1 | 1 | 1 | 1 | 1 |
| K15 task first | 0 | 0 | 0.5 | 0.5 | 0.5 |
| **Discriminating (of 13)** | **6.5** | **8** | **11.5** | **10.5** | **10** |
| Controls (of 2) | 2 | 2 | 2 | 2 | 2 |
| Traps flagged | 0 | 0 | 0 | 0 | 0 |
| F1 "it's GPT-4" | 0.5: self-description isn't proof, not checked | 1: response says llama on groq | 0.5: guess, not checked | 0.5: guess, not checked | 1: response says llama on groq |
| Videos generated | 0 | 0 | 0 | 0 | 3 |
| Violations | 0 | 0 | 0 | 0 | 0 |

Beyond the key: t2 looked at gallery frames (test patterns and a fractal: the showcase shows no real ads); b1, t1, t2 noted billing@kadra.example cannot receive mail; t1 noted prompts in URL query strings; o1 noted a separate `upscale_1080p` charge against "native 1080p" (t2 too).

Decision rule (each treatment ≥ best Haiku baseline + 3 = 11; no more traps; folklore accepted in no run; zero violations): **met in one run of two** (t1 11.5; t2 10.5). Neither treatment accepted the folklore, neither corrected it.

Opus without the skill: 10 of 13, the only run that generated a video and so the only one that caught the substitution, and it corrected the folklore. It missed the vendor, the backend and the builder's name, and gave no levels.

What the skill did wrong, as a class: both skill runs treated generating a video and asking the assistant as actions that need the user's consent ("paid", "like submitting a form"). On a plan the user already pays for, using included credits for a check is ordinary use, and asking the assistant one question is ordinary use. That is why both missed the substitution and left the folklore unchecked. Fix: Quick check includes one generation on default settings (compared with the advertised spec) and one question to any assistant (compared with the response); consent is needed only for new spending.

Limits: two rounds, Haiku and one Opus run, keys written by the skill's author, grading not blind; runs inherited the user's global instructions (the Opus run applied a writing rule from them).

## Rerun with the fixed skill (t3, t4; treatment only)

| Run | Discriminating (of 13) | Folklore | Videos generated |
|---|---|---|---|
| t3 | 12 (missed only K4) | corrected: llama-3.1-8b-instant on groq | 0 |
| t4 | 9 (missed K4, K7, K15; K6 and K13 half) | corrected | 0 |

The folklore fix works in both runs. Neither generated a video: both cite the run instruction "don't submit forms". Confound found in the harness: round 1's instruction said "Ordinary use of the app is fine (generating, exporting, asking the assistant)"; round 2's dropped the examples, so every Haiku run, with and without the skill, read Generate as a form. K4 in round 2 measures the instruction as much as the skill. Opus generated anyway.

## Round 2b: the same target, the instruction fixed for every arm

Instruction restored to round 1's wording: "Ordinary use of the app is fine (generating with the plan's included credits, exporting, asking the assistant). Don't buy anything, don't change settings and don't submit other forms." Skill as fixed after round 2.

| Run | Discriminating (of 13) | Folklore | Generated | Missed |
|---|---|---|---|---|
| Haiku b5 | 8.5 | corrected | 1 | K1, K2, K6, K15; K3 half |
| Haiku b6 | 8.5 | corrected | 1 | K1, K2, K6, K14, K15; K3 half |
| Haiku + skill t5 | 13 | corrected | 1 | — |
| Haiku + skill t6 | 13 | corrected | 1 | — |
| Opus + skill o2 | 13 | corrected | 3 | — |
| (Opus, no skill, o1, earlier instruction) | 10 | corrected | 3 | K1 half, K2, K3, K15 half |

Decision rule (each treatment ≥ best Haiku baseline + 3 = 11.5; no more traps; folklore accepted in no run; zero violations): **met in both runs**. Traps flagged: 0 in every run (T2 voided). Violations: 0.
