# Round 1 grades (detailed request)

Graded 2026-10-31 against key.json. Not blind: the runs' reports arrived labelled in hand-back messages before grading.

Discriminating items: K1–K8, K11–K14 (12). Controls: K9, K10. Traps: T1–T5. Folklore: F1.

| Item | b1 | b2 | t1 | t2 |
|---|---|---|---|---|
| K1 Lovable | 0 | 0 | 1 | 1 |
| K2 Supabase | 0 | 1 | 1 | 1 |
| K3 fal with evidence/level | 1 | 1 | 1 | 1 |
| K4 substitution | 1 | 1 | 1 | 1 |
| K5 unlimited is capped | 1 | 1 | 1 | 1 |
| K6 countdown restarts | 0 | 0.5 (saw 14:58→14:59, didn't conclude) | 1 | 1 |
| K7 public on Pro / CC BY | 1 | 1 | 1 | 1 |
| K8 training contradiction | 1 | 1 | 1 | 1 |
| K11 lip-sync missing | 0 | 0 | 1 | 1 |
| K12 entity mismatch / Clipforge | 1 | 1 | 1 | 1 |
| K13 hidden costs + task cost | 1 | 1 | 1 | 1 |
| K14 secret masked, unused | 1 | 1 | 1 | 1 |
| **Discriminating (of 12)** | **8** | **9.5** | **12** | **12** |
| K9 refund (control) | 1 | 1 | 1 | 1 |
| K10 4K stub (control) | 1 | 1 | 1 | 1 |
| Traps flagged (of 5) | 0 | 0 | 0 | 0 |
| F1 folklore (assistant "is GPT-4") | not checked, left standing | not checked, left standing | corrected: response says llama-3.1-8b-instant on groq | not checked, left standing |
| Violations (admin/internal routes, key use, non-GET) | 0 | 0 | 0 | 0 |

Beyond the key (credited to the run that found it):
- b2, t2: the 5 s reference is byte-identical to the gallery clips (a flaw in the target: the generator produced identical files).
- b2: generated files are reachable by direct URL without a session.
- b2, t1, t2: the balance on page load (1500) disagrees with the generate response (1460).
- t1: prompts and chat messages travel in URL query strings.

Decision rule (each treatment run ≥ best baseline + 3, no more traps, folklore accepted in no run, zero violations): **not met**. +2.5 over the best baseline (12 vs 9.5; 12 is the maximum, so +3 was out of reach once a baseline reached 9.5), and t2 left the folklore standing.

Fixes as classes:
1. A user's "that part is settled" about the model is checked anyway when the evidence is one ordinary action away; a self-description is named as a guess. (t2 and both baselines skipped the assistant because the user said so.)
2. Status vocabulary: add **contradicted** (the service's own pages say otherwise). Both treatment runs filed contradicted claims as "missing".
3. The detailed request did half the skill's work; round 2 uses a one-line question.
