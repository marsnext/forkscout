# Error Recovery Priority

## Classification of Errors

Errors fall into two categories — self-recoverable vs. fatal.

| Category | Definition | Recovery Action |
|----------|------------|----------------|
| **Self-recoverable** | Errors that can be fixed by retrying, adapting, or using alternative tools | Agent acts autonomously to recover |
| **Fatal** | Errors indicating corruption, data loss, or irreparable damage | Immediately notify owner and wait for guidance |

## Self-Recoverable Errors

### Tool-Specific Failures

| Error Type | Recovery Strategy |
|------------|-------------------|
| Rate limit exceeded | Wait, then retry with exponential backoff |
| Network timeout | Retry up to 3 times |
| Invalid input format | Parse error details, ask for corrected input |
| Tool not found | Check tool registration, reload if necessary |

### Example Recovery Flow

```
1. Parse error message for clues
2. Determine if retry is appropriate
3. Implement retry with backoff (1s, 2s, 4s)
4. If still failing, try alternative approach
5. If no alternatives remain, notify owner with details
```

## Fatal Errors

### Corruption Indicators

| Signal | Action |
|--------|--------|
| File deletion without backup | IMMEDIATE OWNER NOTIFICATION |
| Data loss in persistent storage | IMMEDIATE OWNER NOTIFICATION |
| Tool disabled or unregistered | DIAGNOSE → TRY FIX → NOTIFY if unresolved |
| Memory corruption detected | HALT ALL OPERATIONS → OWNER NOTIFICATION |

### System-Wide Failures

| Scenario | Recovery |
|----------|----------|
| Agent restarts unexpectedly | Check logs, verify state persistence |
| Typecheck fails after edit | Revert changes, notify owner |
| MCP server disconnects | Attempt reconnection, notify if persistent |

## Recovery Protocol

### Step 1: Diagnose
- Read error message carefully
- Identify the root cause category
- Check if self-recovery is possible

### Step 2: Attempt Recovery
- Apply appropriate recovery strategy
- Use backup systems if available
- Log all recovery attempts

### Step 3: Escalate If Needed
- If recovery fails after 3 attempts, notify owner
- Provide full error context and recovery attempts made

## Error Logging Template

```
[ERROR RECOVERY]
Timestamp: <datetime>
Error Type: <category>
Message: <full error message>
Recovery Attempts: <count>
Status: <success/failed/escalated>
```

## Important Rules

- Never silently fail — always attempt recovery or escalate
- Never ignore fatal errors — notify owner immediately
- Always log error details for future analysis
- If unsure, default to escalating to owner
