# State Persistence

## What Must Survive Restart?

| State Type | Storage Location | Survival Guarantee |
|------------|------------------|-------------------|
| Chat histories | `.agents/chats/telegram-{chatId}.json` | ✅ Yes |
| Pending tasks | `.agents/tasks/` | ✅ Yes |
| Secret vault aliases | `.agents/vault.json` | ✅ Yes |
| Access requests | `.agents/access-requests.json` | ✅ Yes |
| Auth allowlist | `.agents/auth.json` | ✅ Yes |
| Memory knowledge graph | MCP server internal | ✅ Yes |

## What Can Be Lost?

| State Type | Location | Loss Acceptable? |
|------------|----------|------------------|
| In-memory rate limiter | Runtime only | ✅ Yes (resets on restart) |
| Active tool progress indicators | Runtime only | ✅ Yes |
| Chat abort controllers | Runtime only | ✅ Yes |
| Temporary file caches | `/tmp` or agent cache | ✅ Yes (rebuild on demand) |

## Restart Survival Checklist

Before allowing agent restart, verify:

- [ ] Chat histories are persisted to disk
- [ ] Pending tasks have saved state
- [ ] Secret vault data is backed up
- [ ] Access requests and auth list are saved
- [ ] Memory knowledge graph is exported/backupped

## State Restoration Protocol

### On Agent Startup

1. Load persisted chat histories from `.agents/chats/`
2. Resume pending tasks from `.agents/tasks/`
3. Load secret vault aliases
4. Restore access requests and auth list
5. Reinitialize in-memory state (rate limiters, abort controllers)
6. Verify all persistent data integrity

### Checkpoint Before Restart

```bash
git add -A && git commit -m "Checkpoint: before agent restart"
```

## Session Startup Rules

### What Happens on Startup
- Load all persistent state (chat histories, tasks, vault)
- Reinitialize in-memory runtime state
- Register all tools and MCP servers
- Load channel-specific configurations

### What Must NOT Happen on Startup
- Never delete or overwrite persistent state without owner approval
- Never skip checkpoint before major changes
- Never start processing without loading all persistent state

## State Migration

When system changes require migration:

1. Create backup of all persistent state
2. Run migration script
3. Verify data integrity
4. Notify owner of successful completion
5. Commit migrated state to git history

## Emergency State Recovery

If agent restart causes data loss:

1. **STOP** — do not continue with corrupted state
2. **CHECKPOINT** — save current state as-is
3. **RESTORE** — load from last known-good backup
4. **INVESTIGATE** — determine cause of data loss
5. **FIX** — implement permanent solution to prevent recurrence
6. **NOTIFY** — inform owner of incident and recovery status
