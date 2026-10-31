# Layer 1: promise and advertising

A service is judged against what it says about itself. Collect what it says everywhere it says it, then layer 4 checks each line.

## Where to look

- The landing page and every feature page.
- Pricing: plan names, what each includes, the small print under the table.
- FAQ and help centre.
- Terms of service, privacy policy, refund policy (read in layer 6; claims about features, money and rights go into the register here).
- App Store and Google Play pages: screenshots, description, "in-app purchases", the developer name.
- Demo videos and the showcase gallery.
- Public ad libraries, view only: [Meta Ad Library](https://www.facebook.com/ads/library/) (search the brand), [Google Ads Transparency Center](https://adstransparency.google.com/). They show the ads a company runs and since when.
- The company's own posts and press releases.

## The register

Fill `templates/claims.md`, one row per claim:

| # | Claim | Where | Quote | Type | Status | Evidence | Date |
|---|---|---|---|---|---|---|---|

Types: **feature**, **model** ("powered by GPT-5", "our own model"), **quality**, **speed**, **price** ("free", "unlimited", "−70%"), **data** (privacy, training), **rights** (ownership, commercial use), **trust** ("10,000 teams", "SOC 2").

Quote word for word. Status and evidence are filled in layer 4.

## Is the advertising honest

Check these as their own rows, type **advertising**:

- **Cherry-picked examples.** The gallery and demo against what the test set produces (layer 4). Note when the showcase input type is unlike real work (studio photo vs phone photo, a single object vs a scene).
- **"Free" and "unlimited" with conditions.** The small print: daily caps, slow queue, watermark, non-commercial license, "fair use" limits, free results public by default.
- **Prices.** A crossed-out "old" price nobody ever paid (check the archived pricing page), countdown timers that restart on reload, a monthly price that is only available when paying for a year, "from $X" that applies to the smallest pack.
- **The model in the ad and in the product.** The ad names one model (or "the latest"), the product runs another or an older version (layer 3 tells you which).
- **Channels disagree.** The ad, the landing page, the app store and the terms promise different things: write each version with its source.
- **Social proof.** Logos with no case study, counts with no source, reviews with no author (layer 6, trust).

A claim that can't be checked from outside (a revenue figure, a customer count) gets status **not checkable** and the reason. It is a question for the vendor.
