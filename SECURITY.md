# Security

## What the skill and its scripts do

- They read. The scripts read local files, except `terms.mjs`, which makes a plain GET request to each URL it is given, and `stack-scan.js`, which runs in a browser page and reads what the page has already loaded (resource URLs, script text, meta tags, the names of cookies and storage keys, never their values).
- They send nothing anywhere and read no environment variables or credentials.
- The skill's rules forbid calling endpoints found in shipped code, enumerating IDs, opening admin routes, using someone else's account, using keys found in a bundle and getting around limits.

## Reporting a problem in this repository

If a script could read, send or change something it shouldn't, or an instruction could lead an agent to do so, report it privately through [GitHub's private vulnerability reporting](https://github.com/arez-xd/under-the-hood/security/advisories/new). Please include the script or file, the input, and what happened. You'll get an answer within a week.

## If a check finds a vulnerability in a service

A check sometimes surfaces a secret key in a bundle, an admin route listed in the code, or data that looks exposed. The skill records it, masked, and touches it no further. Don't use it either: report it to the service (its `security.txt`, security page or support address), give it time to fix, and keep it out of anything you publish. `references/verdict.md` § Publishing covers what to remove before a report goes public.
