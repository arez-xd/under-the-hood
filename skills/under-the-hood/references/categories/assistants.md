# Profile: assistants and agents

Chat assistants, "AI employees", research agents, support bots, coding agents sold as a service. The risk here is a capability that exists in the description and in the assistant's own words, and nowhere else.

## What to establish

1. **The model** (layer 3): the docs, the model picker, API responses, vendor hosts. The assistant naming itself is a guess.
2. **What it can actually do,** each claimed capability as a row in `claims.md`:
   - web search and browsing: are requests made, are sources real and do they say what the answer says;
   - files: does it read the whole file or the first pages; tables, scans, long PDFs;
   - actions: sending, booking, editing in other tools — is anything actually done, in which account, with what confirmation;
   - memory: what persists between sessions, and whether you can see and delete it;
   - integrations: connected for real, or a waitlist.
3. **Where your inputs go:** vendor hosts in the network log, the sub-processor list (layer 6), whether conversations train models, how long they are kept.

## Test set

Questions from the user's own work, with known answers:

- **a factual question** with a source the user can check;
- **a question about the user's own document,** uploaded, with the answer on a specific page;
- **a task with steps** the agent claims to perform (search, summarise, draft);
- **a question it should refuse or say it doesn't know.**

For each answer record: correct or not, sources given and whether they hold up, what the agent said it did, what the network log shows it did. "Searched the web" with no search request seen is status **claimed, not observed**.

## Signs worth a line in the report

- Sources that don't exist or don't say what is quoted.
- The same answer regardless of the uploaded file (the file wasn't read).
- "I've sent it" with nothing sent.
- A model picker that changes the label but not the requests.
- Memory that can't be viewed or deleted.
