# The task

A service is good or bad for something. The same 3D generator can be right for concept sketches and wrong for game assets; the same assistant can be fine for drafts and unusable on confidential contracts. Fix the task first; every later layer is judged against it.

## Questions

Ask them one at a time, with a proposed answer the user can accept or correct.

1. **What do you need to get out?** The result, its format and its quality bar. "A GLB under 50k triangles with PBR textures, for a product page." "A 30-second 9:16 video without a watermark." "Answers about our policies, with the source paragraph."
2. **What goes in?** Text prompts, images, files, your own documents, a product photo, a CAD export. Note anything confidential.
3. **How much, how often?** Results per month, length or size, people using it.
4. **Budget,** per month or per year.
5. **Constraints:** commercial use; confidential or personal data; where the data may be stored; API access or the web app only; formats you must export; integrations you rely on.
6. **What would make you leave?** The deal-breakers: a watermark, no commercial license, training on your uploads, no export.

## The test set

Three to five of the user's own inputs, chosen to span the task:

- **an easy one** the service should handle;
- **a typical one,** the median of real work;
- **a hard one:** an edge the task really has (a thin part on a 3D object, a long document, a mixed-language question);
- optionally **a trap for the gallery:** an input like the service's showcase examples, to compare what they show with what you get.

Write the inputs into `task.md` before the first run, with what a good result means for each. Deciding the bar after seeing the output makes any service look fine.

## Without a task

If the user has no task ("is this tool any good?"), state the most likely use from what the service sells and what the user said (who they are, volume, commercial or personal), make the verdict depend on it, and list the questions that would change it. Run Quick check, including, when there is an account, its one generation and one assistant question. Offer to come back with a task.
