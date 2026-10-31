# Is it the model they sell?

A service sells "Seedance" or "Opus". It can serve a cheaper model and keep the label: the swap happens on the server, where nobody outside can see it. This check gathers the evidence that can be gathered from outside, compares it with a reference made the same way at the vendor, and states what the results are consistent with. It never proves fraud; the conclusion is "consistent with X, not consistent with Y", level indirect, plus a question to the service.

## Cost first

A fair comparison needs reference runs at the vendor itself (its playground or API) with the user's own account or key, and paid runs on the service. Before starting, tell the user how many runs each side needs and roughly what they cost, and get a yes.

## Where to test first

A swap pays where the service earns least. Take the markup table from layer 5 (`cost.mjs` with vendor prices): the settings with a thin or negative margin (long clips, high resolution, the top model, the yearly top plan) are where serving a cheaper model saves the most. Spend the paid runs there; a cheap, short default with a ×3 markup has little reason to be swapped.

Before paying, look at what the user already has: results in their account library, each measured with `media-meta.mjs` and `fingerprint.mjs`. They cost nothing and are the user's own.

## Content credentials

Some vendors sign every result (C2PA): `media-meta.mjs` prints the signer, the actions (`c2pa.created` "Created by … Generative AI", an applied invisible watermark) and whether an ingredient (an input file) is listed. Read them for what they are:

- a signature from the vendor of the claimed model is strong evidence that this vendor made the file (direct as a statement by the vendor). `media-meta.mjs` reads the manifest without verifying it; verify the signature with a C2PA verifier (the Content Credentials verify page or `c2patool`) before calling it verified, and say which you did;
- it names the company only: two tiers of one company's image model can carry the same signature, the same library version and the same pixel size, so the signature can't tell them apart;
- an ingredient means the result was made from an input (an edit, image-to-video); a text-to-image result with an ingredient, or an edit without one, is worth a note;
- re-encoding removes credentials: a trimmed, joined or compressed file has none, which proves nothing. An encoder string (such as `x264`) inside a signed file is normal: vendors encode before they sign;
- the claim generator is the tool that last saved the file. A file passed through an editor or an assistant carries that tool's claim, and the generator's claim is lost in the re-save.

**Gallery files are previews.** Showcase and landing videos are usually re-encoded previews: lower resolution, no sound, an encoder string, sometimes another tool's credentials. They say how the gallery was prepared, nothing about the model. Fingerprint the user's own results.

## The evidence, strongest first

| # | Evidence | What it proves | Level |
|---|---|---|---|
| 1 | The model id in the request the client sends (network log) | What the client asks for. The server can still swap it | direct for the request, indirect for what was served |
| 2 | A `model` field in the response, response headers naming the model or the vendor | What the server says it served. A proxy can rewrite it | direct as a statement by the service |
| 3 | Content credentials signed by the claimed model's vendor (C2PA) | That company made the file; tiers of its models look the same | direct as the vendor's statement once verified, indirect when only read |
| 4 | Same seed, same parameters, same input at the vendor gives a near-identical result | Strong: same model and settings | indirect, strong |
| 5 | Technical fingerprint of the result (video and images): sizes, frame rate, durations, frame count, codec, audio, metadata | A mismatch with what the model can produce is a strong sign of another model; a match only says "possible" | indirect |
| 6 | Behaviour (language models): speed and quality on a fixed task set against both candidate models at the vendor | Statistical: "closer to Sonnet than to Opus on 3 measures" | indirect |
| 7 | Price below the vendor's own price for that model, consistently | A reason to ask, nothing more | guess |
| — | The model saying what it is | Nothing: models are often wrong about themselves | not used |

## Video and images

1. **Build the reference.** Either generate 3–5 results at the vendor with the claimed model (and, if you can, with the cheaper model you suspect), or write the model's documented limits into `templates/model-profile.json` from the vendor's docs, with the URL and date. Generated references are better: docs omit details like exact pixel sizes.
2. **Generate on the service** with the same inputs and the closest settings: same prompt, aspect ratio, duration, resolution, seed if offered.
3. **Measure both:** `node scripts/fingerprint.mjs video <service files…> --ref <vendor files…>` (or `--profile model-profile.json`). It compares resolution, frame rate, duration, frame count, codec, audio track and encoder strings, and lists every property where the service's results fall outside what the reference produced.
4. **Same seed:** if the service exposes a seed, run the same seed at the vendor and compare frames side by side (first, middle, last). Near-identical frames settle the question; different frames don't settle it, because the service may rewrite prompts.
5. **Read the delivery domain** of the result (layer 3) and the result's metadata (`media-meta.mjs`).

Typical findings: "The service returns 1280×720 at 16 fps; every vendor reference of the claimed model is 1920×1080 at 24 fps"; "Durations offered are 4 and 8 s; the claimed model only produces 5 and 10 s".

## Language models (Opus or Sonnet)

Services add their own system prompt, so answers can't be compared word for word. Compare distributions instead.

1. **The task set:** 15–20 tasks where the claimed model reliably beats the cheaper one: multi-step reasoning with a checkable answer, a long code task with tests, a long-context question with the answer on a specific page. Write the expected answers and the scoring rule before any run (the same discipline as a blind test).
2. **Three arms:** the service; the claimed model at the vendor; the suspected cheaper model at the vendor. Same tasks, same order, a fresh conversation per task.
3. **Record per task** a line in a JSONL file: `{"arm":"service","task":"t01","ttft_ms":820,"total_ms":14200,"output_chars":2400,"score":1}`.
   - `ttft_ms` and `total_ms` for the web app: in the network log, the streaming request's start, first byte and end; or run this in the page right after the answer finishes and read the last streaming request:
     ```js
     performance.getEntriesByType('resource').filter(r => /chat|completion|message|stream/i.test(r.name)).slice(-1).map(r => ({ url: r.name, ttft_ms: Math.round(r.responseStart - r.startTime), total_ms: Math.round(r.responseEnd - r.startTime) }))
     ```
   - `output_chars`: the length of the answer text.
   - `score`: by the rule written in step 1, without looking at which arm produced it (relabel answers before scoring if you can).
4. **Compare:** `node scripts/fingerprint.mjs llm runs.jsonl`. It prints per arm the median time to first token, the median output speed (characters per second), the mean score, and which vendor arm the service sits closer to on each.

Speed is the clearest single signal between model tiers of one family; quality needs enough tasks to separate. Network distance, load and the service's own processing shift timings, so run at the same time of day and read differences of 2× or more as meaningful, small ones as noise.

## Writing it up

In the report's layer 3:

- what was compared, how many runs per arm, when;
- the measures with numbers;
- the conclusion as consistency: "Results are consistent with a lower tier than advertised on frame rate, resolution and duration; consistent with the advertised model on none" (indirect);
- the question for the service: "Which model and version serve requests on plan X, and are requests ever routed to a different model?"

The report states what was measured and what it is consistent with. Accusations stay out of it.
