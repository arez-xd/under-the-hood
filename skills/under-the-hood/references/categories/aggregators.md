# Profile: aggregators

Services that resell other companies' models under one subscription: "all the best image, video and chat models in one place", studios that wrap a vendor's API in a nicer interface, credit-based generators.

An aggregator is not bad by itself. It can add real value: one bill, one library for results, workflows that chain models, sensible defaults, a better interface. The check separates that value from the markup.

## What to establish

1. **Which models, from which vendors** (layer 3). Count them honestly: model families and variants. "58 models" are often 13 families with sizes, speeds and edit modes listed separately.
2. **Which are really available on the user's plan.** Picker entries that are locked, "coming soon" or always failing count separately.
3. **Is it the model the vendor sells today,** or an older version, a smaller variant, or a lower resolution? Compare parameters in the request with the vendor's own docs.
4. **The price of one action on the default settings,** and on the settings the task needs. Defaults are often the most expensive model.
5. **The vendor's cost for that action** (layer 5): the vendor's public price × the parameters in the request. A range, with the source and the date, and the markup on each plan's credit price (`cost.mjs`).
6. **What is added on top:** workflows across models, a library, prompt tools, editing, sharing, team features. Each one checked in layer 4.
7. **Where results go:** an own library, the vendor's delivery domain (`fal.media`, `replicate.delivery`), how long links live, whether results are public.

## Test set

Run each input on the aggregator and, where the user has access, directly on the vendor (its playground or API) with the same model and parameters. Same model, same input: the difference is the aggregator's prompt rewriting, defaults or downscaling. Note time, cost and quality side by side.

## Signs worth a line in the report

- Prices in the catalogue and on the button disagree.
- The default model costs many times the previous step.
- The picker shows no prices.
- Credits for a failed job don't come back.
- The same company runs several near-identical aggregators (layer 2).
- The vendor has announced the end of an endpoint the service sells (a deprecation date on the vendor's model page): a yearly plan can outlive the model it was bought for.
- Features from the landing page that only open a chat with a preset prompt.
