# Layer 6: rights, data and trust

What you can do with the results, what happens to what you upload, and how much of the trust the service asks for it has earned.

## Read the terms with a script, then with your eyes

```bash
node scripts/terms.mjs https://example.com/terms https://example.com/privacy https://example.com/refund --out terms.md
```

It fetches the public pages (plain GET) or reads saved files, and pulls the sentences on each topic word for word, with the URL and the date: ownership and license of outputs, commercial use, public visibility, training on user data and opting out, retention and deletion, sub-processors and third parties, refunds, cancellation and auto-renewal, credits, governing law and arbitration. Pages rendered by JavaScript come back empty: open them in the browser, save the text to a file and pass the file.

The script only finds the sentences. Read each topic's quotes in context before writing a conclusion, and cite each with its clause number, quoting the deciding words. The report says it is not legal advice.

## Rights to results

- Who owns the output: the user, the service, or nobody (some jurisdictions don't grant copyright to machine output; note it, don't rule on it). Terms often grant a right to use outputs and say nothing about ownership, while the FAQ says "yours": write what each says, with its source.
- The license per plan: commercial use allowed or not; attribution required; free-plan results public or shared under a public license.
- What the service may do with your outputs: show them in its gallery, use them for marketing, train on them.
- Inputs that carry someone else's rights (a celebrity's voice, a brand's product photo): what the terms make the user responsible for.

## Your data

- **Training:** are inputs and outputs used to train models (the service's or the vendor's), by default or by opt-in, and how to opt out. Quote it.
- **Retention and deletion:** how long inputs, outputs and conversations are kept, whether deleting the account deletes them.
- **Third parties:** the sub-processor list, and the model vendors from layer 3. Inputs sent to a vendor fall under the vendor's terms too; note which.
- **Where:** the jurisdiction of storage and of the company, if the task has constraints.
- **Session recording and trackers** seen in layer 3 (Hotjar, Clarity, ad pixels): the user's screen and prompts may be recorded.

## Lock-in

- Export formats and quality, bulk export, API access per plan.
- What happens to projects, results and history after cancelling.
- How much of the workflow lives only inside the service (prompts, presets, characters, fine-tunes).

## Trust signals

Check each and write what holds up:

- customer logos and counts: a case study or a source behind them;
- certifications (SOC 2, ISO 27001): a link to the report or a trust page with a date;
- reviews: authors and platforms that can be checked;
- AI-written copy, stock or generated people in testimonials, broken pages and placeholder text. Slop is a sign of speed and of how much care went in. It is not a verdict on the product.
