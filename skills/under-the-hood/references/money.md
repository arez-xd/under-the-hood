# Layer 5: money

The price on the pricing page is rarely what the task costs. Compute the user's month, find the costs the table doesn't show, and check how to leave.

## The user's month

Fill `templates/pricing.json` from the pricing page and layer 4:

- plans: price, billing period (day, week, 28d, month, quarter, half-year, year), credits included and how often they come (a daily allowance is `creditsPer: "day"`), `"unlimited"` for a plan without a credit count, whether unused credits roll over;
- top-ups: credits and price for each pack (the script buys the cheapest mix that covers the gap);
- actions: credits per action on the settings the task needs (read on the button: the catalogue price can differ), and `price` for money charged per action outside credits (pay per use, paid exports);
- the volume from `task.md`;
- retries: how many attempts a usable result took in layer 4.

Run `node scripts/cost.mjs pricing.json`. It prints, for each plan, the credits the month needs, whether the plan covers them, the top-ups to buy, money charged per use, the total, the cost per usable result, and credits left unused. Save it as `cost.md`.

Annual billing: compare the monthly price paid yearly with the true monthly price; "$8/month" billed as $96 up front is $96. Billing "every 4 weeks" is 13 charges a year: compare prices per year (`period: "28d"` in `pricing.json`).

## Costs the table doesn't show

- credits that expire at the end of the period;
- retries: a usable result after three attempts costs three;
- paid extras: upscaling, export in some formats, removing the watermark, longer outputs, faster queue;
- the commercial license only on a higher plan;
- seats: per-user pricing for a team;
- overage priced higher than the plan's own credits.

## The vendor's cost (aggregators)

For a service that resells another company's model, estimate what one action costs the service:

1. take the model and parameters from the request in the network log (layer 3); with public data only, from the model ids in the catalog or bundle, the prices the app shows per setting (some studios show them without an account), or an advertised count ("about 160 videos for 4,000 credits" means about 25 credits a video). Do this step on public data too: it needs no account;
2. take the vendor's public price for those parameters, with the URL and the date;
3. compute a range (resolution, length, steps can vary), and compare with what the user pays per action.

Always label it an estimate. It shows the markup and how exposed the service is to the vendor's price changes; it is not the service's real cost, which includes infrastructure, failed jobs and discounts the public can't see.

**Per plan.** A credit costs a different amount on each plan: monthly, yearly, top-ups. The same action can carry ×3 on the cheapest monthly plan and sit at or below the vendor's price on the yearly top tier. Put `vendorCost` and `vendorSource` on each action in `pricing.json`. `cost.mjs` then prints two things:

- **your month against the vendor:** the plan's total for the user's volume against the same runs at the vendor's prices. This works for every way of charging: credits, a flat fee, "unlimited", pay per use;
- **one action at full use of each plan's credits** and each top-up, against the vendor's price, with the settings where the margin is thin or negative.

`vendorCost` takes one price, a list of calls for an action that makes several (`[{ "call": "image to 3D", "cost": 0.4 }, { "call": "texture", "cost": 0.1 }]`), or tokens for a language model (`{ "tokensIn": 2000, "tokensOut": 600, "perMillionIn": 3, "perMillionOut": 15 }`, with the token counts of a typical message from the task). A service that runs its own model has no vendor price: this comparison doesn't apply; compare its price with the alternatives the user would otherwise use.

**Read prices without spending.** Many studios show the credit price on the Generate button and update it as settings change. Step through the settings that matter (length, resolution, sound, model) and write down each price; nothing is generated until the button is pressed. Long and high-resolution settings are where a markup turns thin, and where an advertised count ("about 9 videos on this plan") holds only on the smallest settings. Note which settings the advertised count assumes.

**Read it for the user too.** A high markup on the plan the user would buy is a reason to price the same models directly at the vendor; a thin margin on long or high-resolution settings is where serving a cheaper model pays the service most (`substitution.md`, Where to test first).

## Leaving

- **Cancel:** where it is, how many steps, whether it works in the app or only by email. Quote the terms and the help centre; when they disagree, it is a finding.
- **Refunds:** the policy's clause, with the deciding words quoted; badges ("100% money-back") against the policy text.
- **Auto-renewal and trials:** does the trial need a card, does it convert silently, is there a reminder.
- **What happens to results and projects** after cancelling (layer 6, lock-in).
