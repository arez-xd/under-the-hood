# Layer 4: what works on your task

Two checks with the user's own account: every promise from the register, and the test set measured by the category profile. With public data only, this layer covers what public docs and the user's own files show; everything else gets status **not checked**, with what would answer it (`access.md`).

## The promises

Give each row of `claims.md` a status, evidence and a date:

| Status | Means | Evidence |
|---|---|---|
| **works** | The action produced the promised result | the result file or a screenshot, and the request in the log |
| **interface only** | A button or screen exists; nothing is sent or nothing comes back | a screenshot and the empty network log for the click |
| **stub** | "Coming soon", an empty section, a disabled control, a menu item that leads nowhere | a screenshot |
| **missing** | Promised, not found anywhere in the product | where you looked |
| **contradicted** | The service's own pages, terms or responses say otherwise ("never used for training" against the privacy policy) | both quotes, with their pages |
| **not checked** | Needs payment, a role or data the user doesn't have | why, and what it would take |
| **not checkable** | Can't be verified from outside (customer counts, revenue) | — a question for the vendor |

"Works" without evidence is not allowed; `claims-check.mjs` rejects it.

To see whether a button sends anything without sending it, read the network log while clicking an action that is free and harmless, or read which request the code builds for it. Never trigger paid, destructive or state-changing actions on the user's behalf without asking.

## How many, really

Menus inflate. Count what the product actually does:

- tools in the menu → distinct operations behind them (twelve "tools" that are four prompt templates over one model);
- "all your favourite models" → models actually selectable, by vendor;
- "templates" → templates that change the output, and those that only change the title.

Write both numbers: "12 tools in the menu, 4 operations".

## The test set

Run every input from `task.md` the same way: the default settings first, then the settings the task needs. Save each result in `outputs/` with the input, the settings, the time it took and the credits it cost.

Then measure each result by the category profile:

- 3D generators → `categories/3d.md`
- aggregators reselling other models → `categories/aggregators.md`
- assistants and agents → `categories/assistants.md`

Compare with layer 1: does the test set land near the gallery, or only the easy input does? Write it plainly: "3 of 4 inputs below the showcase; the hard one failed".

## Waiting, failing, retrying

Note what happens around the result: queue time, a failed job and whether credits come back, how many retries a usable result took (and what they cost — layer 5).
