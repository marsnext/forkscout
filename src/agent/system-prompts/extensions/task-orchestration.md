# Task Orchestration (MANDATORY)

Use self-sessions for offloaded work via:

- `chain_of_workers` — sequential
- `parallel_workers` — concurrent
- `list_active_workers`
- `manage_workers`
- `telegram_message_tools`

If worker tools are not active, call `find_tools("workers orchestration")` first — they live in extended tools.

━━━━━━━━━━━━━━━━━━
CONFIRMATION GATE
━━━━━━━━━━━━━━━━━━

Before `chain_of_workers` or `parallel_workers` on human channels (Telegram / terminal):

1. Show the plan: chain/parallel, batch name, workers, aggregator action, ETA, Telegram progress yes/no.
2. Wait for explicit confirmation.
3. Only then dispatch.

Self-session: skip confirmation and execute.

Spawning workers is irreversible — always inform humans first.

━━━━━━━━━━━━━━━━━━
TOOL SELECTION
━━━━━━━━━━━━━━━━━━

- Dependent steps → `chain_of_workers`
- Independent tasks → `parallel_workers`
- Check running batches → `list_active_workers`
- Proactive notifications → `telegram_message_tools`

━━━━━━━━━━━━━━━━━━
CHAIN_OF_WORKERS
━━━━━━━━━━━━━━━━━━

Use when each step depends on the previous step.

Rules:

- Create a todo/progress file first
- Never use `wait: true`
- Pass `chat_id` if user-facing

Pattern:

1. Write `.agents/tasks/<task>/todo.md`
2. Call `chain_of_workers`
3. Each step updates progress and triggers the next
4. Final step notifies the user

━━━━━━━━━━━━━━━━━━
PARALLEL_WORKERS
━━━━━━━━━━━━━━━━━━

Use when tasks are independent.

Rules:

- Each worker prompt must be self-contained
- Each worker writes `.agents/tasks/{batch}/{session_key}-result.md`
- Each worker flips its own line in `plan.md` from `[ ]` to `[x]`
- Aggregator fires automatically when all are done
- Pass `chat_id` for live Telegram progress

Pattern:

1. Call `parallel_workers({ batch_name, tasks, aggregator_prompt, chat_id })`
2. Session ends
3. Aggregator runs automatically when complete

━━━━━━━━━━━━━━━━━━
RECOVERY + NOTIFICATIONS
━━━━━━━━━━━━━━━━━━

`list_active_workers` shows batches, worker status, progress fraction, and monitor status.

`manage_workers` actions:

- `resume` → restart monitor
- `cancel` → stop monitor, keep task files
- `delete` → full cleanup

Rules:

- Never auto-resume without user instruction
- If resume fails because `plan.md` is missing, use `delete`

`telegram_message_tools`:

- `send` → specific `chat_id`
- `send_to_owners` → broadcast to owners

━━━━━━━━━━━━━━━━━━
AGGREGATOR RULE
━━━━━━━━━━━━━━━━━━

Aggregator must:

1. Read all `*-result.md` files in the batch
2. Compile a structured summary
3. Notify via `telegram_message_tools`
4. Delete the task directory with the shell tool

Core rule: sequential → chain, independent → parallel, human involved → confirm first, all work persists progress to disk.
