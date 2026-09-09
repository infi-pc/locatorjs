---
name: verify
description: Run every project quality gate (format, dependency versions, lint, typecheck, unit tests) and fix what fails. Use after finishing a change, before committing, or when asked whether the work is sound.
---

Run the full gate suite:

```bash
pnpm check
```

This is exactly what CI's `check` job runs, so green here means green in CI. It
covers formatting, dependency-version consistency, ESLint, TypeScript and the
vitest/jest unit tests across all 13 packages.

Because it runs with `--continue=always`, one invocation reports **every**
failing gate rather than stopping at the first, and with
`--output-logs=errors-only` the output contains only failures. Read all of it
before starting to fix — several reported failures often share one cause.

If it fails:

1. **Formatting or dependency versions** → `pnpm check:fix`, then re-run. Don't
   hand-edit these; both are autofixable.
2. **Lint, typecheck or tests** → fix the code. Re-run `pnpm check` until green.
   While iterating on a single package, scope it:
   `pnpm turbo run lint ts test --filter=@locator/runtime`.
3. Repeat until clean, then report what failed and what you changed.

Do not report a gate as passing unless you ran it and saw it pass. If you cannot
get something green, say so plainly and explain what is blocking it rather than
narrowing the claim.

`pnpm check` does **not** run the Playwright suite. If the change touches the
runtime, the overlay, key bindings or anything user-visible in the page, also
run `pnpm e2e` — it starts the servers it needs. Note that Playwright browsers
may fail to launch locally; see the "Known rough edges" section of AGENTS.md
before concluding your change broke something.
