# System Prompt Extensions — How This Folder Works

## Purpose

This folder holds **on-demand instruction modules** referenced from `identity.ts`.

Instead of embedding verbose instructions directly in the system prompt (which grows the context window on every call), `identity.ts` contains a single one-liner per topic. When the agent needs to act on that topic, it calls `read_file` on the relevant `.md` file to load the full instructions.

---

## File Standard

Each file is a plain Markdown document — no TypeScript, no exports, no magic.

| Rule               | Detail                                          |
| ------------------ | ----------------------------------------------- |
| File name          | `kebab-case.md`                                 |
| Contents           | Plain Markdown — headings, bullets, code blocks |
| Tone               | Direct imperative instructions for the agent    |
| No side effects    | Pure documentation only                         |
| One topic per file | Do not combine unrelated topics                 |

---

## How Files Are Referenced

In `identity.ts`, each section is replaced with a one-liner:

```
📋 For <topic>: read_file('src/agent/system-prompts/extensions/<file>.md')
```

The agent calls `read_file` with that path when it needs the instructions.

---

## Current Files

| File                          | Topic                                                                                       | In identity.ts? |
| ----------------------------- | ------------------------------------------------------------------------------------------- | --------------- |
| `file-editing.md`             | File editing workflow: folder standards, checkpoint commit, typecheck, verify startup       | ✅              |
| `error-repair.md`             | Error diagnosis & self-repair: repair loop, all failure types, log commands                 | ✅              |
| `error-recovery-priority.md`  | Error classification: fatal vs self-recoverable, recovery protocol, escalation              | ✅              |
| `tool-error-recovery.md`      | Tool failure protocol: diagnose → fix → typecheck → retry                                   | ✅              |
| `memory.md`                   | Memory (forkscout-mem MCP): session startup, what to save, quality rules, task lifecycle    | ✅              |
| `task-orchestration.md`       | Spawning self-sessions, parallel workers, sequential chains, notifying users                | ✅              |
| `role-definition.md`          | Agent vs assistant, autonomy spectrum, self-modification rules                              | ✅              |
| `security-and-trust.md`       | Trust levels, secret handling, security rules beyond the vault                              | ✅              |
| `state-persistence.md`        | State persistence, saving progress across restarts                                          | ✅              |
| `performance-optimization.md` | Token budgeting, latency reduction, performance patterns                                    | ✅              |
| `role-admin.md`               | Per-turn instructions for `[ADMIN]` messages: allowed capabilities, forbidden actions, tone | Role extension  |
| `role-user.md`                | Per-turn instructions for `[USER]` messages: allowed capabilities, forbidden actions, tone  | Role extension  |

---

## Adding a New Extension

1. Create `src/agent/system-prompts/extensions/<topic>.md`
2. Write clear, actionable instructions (imperative tone, agent-facing)
3. Add a one-liner reference in `identity.ts`:
   ```
   📋 For <topic>: read_file('src/agent/system-prompts/extensions/<topic>.md')
   ```
4. Update the "Current Files" table above
