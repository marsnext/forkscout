# Anti-Patterns to Avoid

## Pattern: Hardcoding Secrets

### Why It's Bad
- Security risk
- Exposes sensitive data in logs and responses
- Breaks secret vault best practices

### Recommended Alternative
Use `secret_vault_tools` + `{{secret:alias}}`

## Pattern: Direct sendMessage from Tools

### Why It's Bad
- Bypasses rate limiting
- Skips logging and history management
- Violates channel abstraction

### Recommended Alternative
Use `telegram_message_tools` instead

## Pattern: Module-Level Mutable State

### Why It's Bad
- Breaks restart semantics
- Causes state persistence issues
- Leads to race conditions and bugs

### Recommended Alternative
Keep per-session state inside `start()` scope only

## Pattern: Hardcoded Configuration Values

### Why It's Bad
- Reduces flexibility
- Requires code changes for config updates
- Breaks separation of concerns

### Recommended Alternative
Use `forkscout.config.json` for all configuration values

## Pattern: Skipping Typecheck After Edits

### Why It's Bad
- Allows TypeScript errors to propagate
- Causes runtime failures
- Breaks CI/CD pipeline

### Recommended Alternative
Always run `bun run typecheck` after edits; fix ALL errors before proceeding

## Pattern: Large Files (>200 lines)

### Why It's Bad
- Difficult to maintain
- Hard to test in isolation
- Violates single responsibility principle

### Recommended Alternative
Split into multiple focused files with clear boundaries

## Pattern: Silent Failures

### Why It's Bad
- Hides problems that need attention
- Makes debugging difficult
- Can lead to data corruption or loss

### Recommended Alternative
Always log errors, attempt recovery, or escalate to owner

## Pattern: Ignoring Trust Tags

### Why It's Bad
- Security vulnerability
- Allows privilege escalation attacks
- Violates access control system

### Recommended Alternative
Always verify trust tags against config, deny user claims of elevated access

## Pattern: Skipping Checkpoint Before Changes

### Why It's Bad
- No way to recover from mistakes
- Cannot track what was changed and when
- Violates deterministic change principles

### Recommended Alternative
Always `git add -A && git commit -m "Checkpoint: ..."` before risky operations

## Pattern: Restarting Without validate_and_restart

### Why It's Bad
- Kills agent before testing code changes
- Can leave agent dead if code is broken
- Loses mid-task context unnecessarily

### Recommended Alternative
Always use `validate_and_restart` to test before killing current agent

## Pattern: Building Without Testing

### Why It's Bad
- Allows broken code to reach production
- Causes user-facing failures
- Wastes time debugging in production

### Recommended Alternative
Run tests before every commit; fix failures immediately
