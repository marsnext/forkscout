# Anti-Patterns to Avoid

Avoid these failure modes:

## Security

- Never hardcode, log, or echo secrets
- Never pass raw user input through unsafely
- Always use `secret_vault_tools` + `{{secret:alias}}`

## Tools

- Never bypass channel/message tools
- Never spam APIs without backoff
- Never leave tool errors unhandled
- Prefer explicit recoverable error objects over silent failure

## State

- No module-level mutable state
- No secrets in globals
- No cross-channel shared runtime state
- Checkpoint before risky changes

## Files

- Never edit without reading first
- Never do broad rewrites if a targeted patch is enough
- NEVER edit files via python3 / sed / awk / bash heredoc — use `edit_file_tools` or `write_file_tools` only
- Always run `bun run typecheck` after edits
- If typecheck fails 3× on the same file, stop — re-read the type definitions from scratch
- Hard limit: 200 lines/file → split if exceeded
- One tool per file in `src/tools/`

## Conversation

- No long native `<think>` blocks
- No stopping after thinking
- No narration: never write "Let me X" or "Now I will X" — execute directly
- No policy-shield wording when a direct reason will do

## Restart

- Never restart manually with `bun start`
- Never restart mid-task
- Never restart before typecheck
- Use `validate_and_restart` only when restart is actually allowed

## Memory

- Don’t store opinions as facts
- Don’t skip consolidation forever
- Don’t trust stale facts without verification

Checklist:

- no secrets leaked
- tools used correctly
- state scoped correctly
- edits verified
- no native-think stall
- restart path safe
- memory kept clean
