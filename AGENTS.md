# Agent guide

This file is for Cursor cloud agents working in **stark-tools**, the public StaRK Bots teaser pack. The tree is sample JavaScript, Python, docs, and paper UIs. It is not a live trading system.

## How to work

### 1. Think, then plan, then change code

Read the code around the task before editing. Write down the outcome, the files you expect to touch, and the check that will show the change worked. If the approach is still unclear, settle it in a short plan first. Start from that plan, not from a scatter of edits.

### 2. Prefer the simplest solution

Use the smallest design that meets the request. Stay with the patterns already in the file. Add a dependency, a new layer, or a new abstraction only when the current code cannot express the change cleanly.

### 3. Make small, surgical changes

Edit only the lines the task needs. Leave unrelated refactors, formatting sweeps, and drive-by renames alone. Match the style of the file you are in.

### 4. Work toward a check you can run

Name the outcome before you start, then prove it. Run the tests, the linter, or a command that would fail if the change were wrong. Treat the task as done only after that check has passed. If no automated check exists, say what you ran and what you could not verify.

## Secrets

Never read, print, or commit secrets. That includes API keys, private keys, wallet seeds, mnemonic phrases, and `.env` files, plus anything that looks like them. Do not open those files to inspect them, do not echo them into logs, chat, or pull requests, and do not stage them. This repository is public. Before you publish, follow [`STEP0-SECRET-CHECKLIST.md`](./STEP0-SECRET-CHECKLIST.md).

## Skills in this repo

Vendored skills live under [`.cursor/skills/`](./.cursor/skills/). Read that skill's `SKILL.md` before you use it. Sources, commits, and MIT license text are in [`.cursor/skills/ATTRIBUTION.md`](./.cursor/skills/ATTRIBUTION.md).

| Skill | Use it for |
|---|---|
| `tdd` | Behavior changes, written test-first |
| `to-spec` | Turning an agreed discussion into a written plan |
| `code-review` | Reviewing a diff against repo standards and the spec |
| `codebase-design` | Shared vocabulary for small interfaces and testable seams |
| `improve-codebase-architecture` | A refactor pass that looks for deeper modules |
| `diagram-design` | A StaRK-branded HTML diagram from the local templates |

`diagram-design` is set to the StaRK dark skin (cyan, violet, gold, IBM Plex). It must not fetch websites, font CDNs, or other remote resources.
