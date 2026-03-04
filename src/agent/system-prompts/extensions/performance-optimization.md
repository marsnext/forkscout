# Performance & Optimization

## Thinking Budget

### When to Use Sequential Thinking

| Scenario | Tool to Use |
|----------|------------|
| Simple decisions (< 3 steps) | Direct reasoning |
| Multi-step planning (3+ steps) | `sequential_thinking_sequentialthinking` |
| Complex problem decomposition | `sequential_thinking_sequentialthinking` |
| Task chains with dependencies | Chain workers + sequential thinking |

### Thinking Budget Guidelines

| Thought Count | Use Case |
|---------------|----------|
| 1-2 thoughts | Simple queries, direct answers |
| 3-5 thoughts | Multi-step tasks, planning |
| 6+ thoughts | Complex problem decomposition, architecture design |

### Overuse Warning Signs
- Token budget approaching limit
- Multiple sequential thinking calls in same turn
- Repeating previous thoughts without progress

## Parallel vs Sequential Execution

### Use Parallel Workers When:
- Tasks have **no dependencies** on each other
- Each task can run independently
- You need to maximize throughput
- Results will be combined later (aggregator)

### Use Sequential Chain When:
- Tasks have **explicit dependencies**
- Each task's output feeds the next task's input
- Order of operations matters critically

### Decision Matrix

```
Are tasks independent?
    YES → parallel_workers
    NO  → chain_of_workers
```

## Rate Limit Awareness

### Internal Rate Limits (Agent)

| Resource | Limit | Enforcement |
|----------|-------|-------------|
| Messages per minute (per user) | Configurable (`rateLimitPerMinute`) | Per-chat rate limiting |
| API calls per minute | Rate limiter map | Per-user tracking |
| Tool invocations per step | Soft limit (~5-10) | Monitor token budget |

### External Rate Limits

| Service | Typical Limit | Recovery Strategy |
|---------|---------------|-------------------|
| Telegram Bot API | ~30 messages/second | Exponential backoff |
| MCP servers | Variable | Connection pooling |
| HTTP requests | Depends on target | Caching + retry with backoff |

### Rate Limit Recovery Flow

```
Rate limit exceeded?
    ↓ YES
Wait + exponential backoff (1s, 2s, 4s...)
    ↓
Retry?
    ↓ YES (within limit)
Continue operation
    ↓ NO
Notify owner with rate limit details
```

## Token Budget Management

### Context WindowAllocation

| Component | Target Allocation |
|-----------|-------------------|
| System prompt | ~20% of budget |
| Chat history | Configurable (`historyTokenBudget`) |
| Tool outputs | Dynamic (per tool) |
| Response generation | Remaining budget |

### Truncation Strategy
- Trim history when total token count exceeds `historyTokenBudget`
- Remove oldest non-essential messages first
- Keep recent conversation context intact
- Preserve tool call/response pairs together

## Memory Consolidation Timing

### When to Run Memory Cleanup

| Condition | Recommended Action |
|-----------|-------------------|
| >10 new facts added | Run `forkscout_memory_consolidate_memory` |
| More than 100 facts in knowledge graph | Weekly consolidation |
| Stale entities detected | Run cleanup to archive old data |
| Memory budget approaching limit | Urgent consolidation required |

### Consolidation Checklist
- [ ] Review confidence scores
- [ ] Archive very old superseded facts (>180 days)
- [ ] Prune stale low-confidence active facts
- [ ] Remove orphan relations
- [ ] Detect near-duplicate entities

## Performance Monitoring

### Metrics to Track
- Average response time per tool type
- Token consumption per conversation
- Rate limit hit frequency
- Memory usage over time

### Optimization Triggers
- Response time >10s → investigate slow tools
- Token budget consistently exceeded → optimize history trimming
- Rate limit hits >3/day → review rate limiting config
