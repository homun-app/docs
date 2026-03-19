# Automations & Workflows

Homun can run tasks on a schedule, respond to events automatically, and execute multi-step workflows with approval gates. This page covers cron jobs, the heartbeat scheduler, the visual automations builder, persistent workflows, and practical examples for each system.

## Three Automation Systems

Homun provides three distinct automation systems, each designed for different use cases:

| System | Purpose | Complexity | Persistence |
|--------|---------|:----------:|:-----------:|
| **Cron Jobs** | Time-based recurring tasks | Simple | Survives restarts |
| **Automations** | Event-driven visual flows with conditions and branching | Medium | Survives restarts |
| **Workflows** | Multi-step processes with approval gates and retry logic | Advanced | Full persistence + resume |

Use cron jobs for straightforward scheduled tasks ("check emails every morning"). Use automations for conditional logic ("if an email is urgent, alert me on Telegram; otherwise save a summary"). Use workflows for multi-step business processes that need human approval ("research, draft, review, publish").

## Cron Jobs

Schedule recurring tasks using standard cron expressions. Cron jobs run inside the agent loop, meaning Homun has full access to all tools, memory, and skills when executing them.

### Adding a Cron Job

```bash
homun cron add "0 9 * * *" "Check my emails and summarize anything important"
```

The first argument is the cron expression, the second is the natural language instruction. Homun interprets the instruction the same way it would a chat message -- it can use any available tool, activate skills, search memory, and browse the web.

### Cron Expression Syntax

Standard 5-field format: `minute hour day-of-month month day-of-week`

```
 ┌─── minute (0-59)
 │ ┌─── hour (0-23)
 │ │ ┌─── day of month (1-31)
 │ │ │ ┌─── month (1-12)
 │ │ │ │ ┌─── day of week (0-7, 0 and 7 are Sunday)
 │ │ │ │ │
 * * * * *
```

### Common Schedules

| Expression | Schedule |
|------------|----------|
| `0 9 * * *` | Every day at 9:00 AM |
| `0 9 * * 1-5` | Weekdays (Mon-Fri) at 9:00 AM |
| `30 8 * * 1` | Every Monday at 8:30 AM |
| `0 0 1 * *` | First day of each month at midnight |
| `0 */2 * * *` | Every 2 hours |
| `0 9,18 * * *` | At 9:00 AM and 6:00 PM |
| `*/15 * * * *` | Every 15 minutes |
| `0 9 * * 1,3,5` | Monday, Wednesday, Friday at 9:00 AM |
| `0 22 * * 0` | Every Sunday at 10:00 PM |
| `0 12 15 * *` | 15th of every month at noon |

### Special Characters

| Character | Meaning | Example |
|-----------|---------|---------|
| `*` | Every value | `* * * * *` = every minute |
| `,` | List of values | `1,15 * * * *` = minute 1 and 15 |
| `-` | Range | `1-5` = Monday through Friday |
| `/` | Step | `*/10` = every 10 units |

### Timezone Handling

Cron expressions are evaluated in the server's **local timezone**, not UTC. If your server is set to `America/New_York`, `0 9 * * *` runs at 9:00 AM Eastern Time.

To check your server's timezone:

```bash
date +%Z
```

If you need UTC scheduling, adjust the hour accordingly or set your server timezone to UTC.

Keep in mind that daylight saving time transitions may cause jobs to run an hour early, an hour late, or twice on the transition day (depending on the timezone and direction of the change). For critical tasks, consider using UTC to avoid this.

### Managing Cron Jobs

```bash
# List all scheduled jobs with IDs and next run time
homun cron list

# Output:
# ID  | Schedule          | Task                              | Next Run
# 1   | 0 9 * * 1-5       | Check emails and summarize        | 2025-01-20 09:00
# 2   | 30 8 * * 1        | Weekly calendar review            | 2025-01-20 08:30
# 3   | 0 0 1 * *         | Monthly expense report            | 2025-02-01 00:00

# Remove a job by ID
homun cron remove 1
```

From the Web UI: go to **Automations** to see all cron jobs, their schedules, last run results, and next scheduled time. You can add, edit, and remove jobs from this page.

### What Happens on Restart

Cron jobs are persisted in the SQLite database. When the gateway restarts:
- All cron jobs are re-registered with the scheduler
- Jobs that were missed during downtime do **not** retroactively run
- The next scheduled execution happens at the normal time

If the gateway was down for 3 hours and a job was supposed to run during that time, it will not run until the next scheduled occurrence after the gateway is back up.

### Practical Cron Examples

**Daily email summary** -- check emails every weekday morning:

```bash
homun cron add "0 9 * * 1-5" "Check my emails. Summarize important ones and send me a digest on Telegram."
```

**Weekly report** -- generate a status report every Friday:

```bash
homun cron add "0 17 * * 5" "Review this week's git commits in ~/Projects/myapp. Write a summary of what was accomplished and save it to ~/reports/weekly-YYYY-MM-DD.md"
```

**Monitoring** -- check a website every hour:

```bash
homun cron add "0 * * * *" "Fetch https://status.example.com and check if all services are operational. If anything is down, send me a Telegram alert."
```

**Database backup reminder** -- monthly:

```bash
homun cron add "0 10 1 * *" "Remind me to run the database backup for the production server."
```

**News digest** -- every morning, research and summarize:

```bash
homun cron add "0 7 * * *" "Search for the latest news about Rust programming language. Write a 5-bullet summary and send it to me on Telegram."
```

**Price monitoring** -- every 6 hours:

```bash
homun cron add "0 */6 * * *" "Check the price of RTX 5090 on Amazon. If it dropped below 2000 EUR, send me a Telegram alert with the price and link."
```

## Heartbeat Scheduler

The heartbeat is a proactive wake-up system. Unlike cron jobs which run at fixed times with specific instructions, the heartbeat wakes Homun up periodically to check if there is anything it should proactively do.

### How It Differs from Cron

| Feature | Cron | Heartbeat |
|---------|------|-----------|
| Trigger | Fixed schedule | Periodic interval |
| Task | Specific instruction you write | Agent decides what to do |
| Context | Executes one instruction | Reviews full agent context (memory, pending items, recent events) |
| Configuration | Per-job cron expression | Single interval setting |

### What the Heartbeat Does

When the heartbeat fires, Homun reviews its current state:
- Are there pending approvals that need a reminder?
- Are there tasks the user asked to track?
- Did any monitored conditions change?
- Are there follow-up items from recent conversations?

If Homun finds something actionable, it acts (sends a message, runs a tool, etc.). If there is nothing to do, the heartbeat silently completes.

### Configuration

The heartbeat runs automatically when the gateway is active:

```toml
[heartbeat]
interval_secs = 3600    # Check every hour (default)
```

Set a shorter interval (e.g., 900 for 15 minutes) for more responsive proactive behavior. Set a longer interval (e.g., 7200 for 2 hours) to reduce resource usage.

Setting `interval_secs = 0` disables the heartbeat entirely.

## Visual Automations Builder

The Web UI includes a visual flow builder for creating complex automations without writing code or cron expressions. Access it at **Automations** in the sidebar.

### How It Works

Automations are built as directed flows: a graph of connected nodes where data flows from triggers through conditions to actions. The builder provides an n8n-style SVG canvas where you drag, connect, and configure nodes visually.

Each automation has:
- A **trigger** that starts the flow (schedule, webhook, event)
- Zero or more **processing nodes** (conditions, LLM calls, tools)
- One or more **output nodes** (send message, HTTP request)

### Node Kinds

The builder supports 11 node kinds:

| Node Kind | Category | Description |
|-----------|----------|-------------|
| **Schedule Trigger** | Trigger | Starts the flow on a cron schedule |
| **Webhook Trigger** | Trigger | Starts when an HTTP request hits a webhook URL |
| **Event Trigger** | Trigger | Starts on internal events (new message, email received, etc.) |
| **Condition** | Logic | Branches the flow based on a condition (if/else) |
| **Switch** | Logic | Multi-way branch based on a value (like a switch/case) |
| **LLM Call** | Processing | Sends a prompt to the LLM and captures the response |
| **Tool Execution** | Processing | Runs a specific tool with parameters |
| **Delay** | Control | Waits for a specified duration before continuing |
| **Loop** | Control | Repeats a section of the flow for each item in a list |
| **Send Message** | Output | Sends a message to a specified channel |
| **HTTP Request** | Output | Makes an HTTP request to an external API |

### Building an Automation Step by Step

1. **Add a trigger**: every automation starts with a trigger node. Drag one from the node palette on the left to the canvas. Configure it (e.g., set the cron expression for a Schedule Trigger).

2. **Add processing nodes**: drag condition, LLM call, or tool execution nodes onto the canvas. These form the logic of your automation.

3. **Add output nodes**: end the flow with a Send Message or HTTP Request node that produces the final result.

4. **Configure each node**: click a node to open the inspector panel on the right. Use dropdowns (populated from your actual configuration) to select tools, models, channels, etc. The inspector validates your inputs in real-time.

5. **Connect nodes**: drag from one node's output port (bottom) to another node's input port (top). Condition nodes have two outputs: "true" and "false" for branching.

6. **Save and activate**: click **Save** to store the automation as a draft, then toggle it to **Active** to start running.

### Guided Inspector

The inspector panel uses guided inputs, not free text. When you configure a tool execution node:
- The tool dropdown lists all available tools from your registry
- Parameter fields are generated from the tool's JSON Schema
- Channel dropdowns show your configured channels
- Model dropdowns show your configured LLM providers

This approach prevents typos and invalid configurations.

### NLP Flow Generation

Instead of building flows manually, describe what you want in plain language:

> "Every morning at 9 AM, check my emails. If there's anything urgent, send me a Telegram message. Otherwise, save a summary to my knowledge base."

Homun generates the complete automation flow using an LLM. The generated flow appears in the visual builder where you can review, edit, and adjust before activating.

The NLP generator creates proper nodes with the right connections, but you should always review the result. Complex automations may need manual adjustment.

### Automation States

| State | Meaning |
|-------|---------|
| Draft | Saved but not active. Will not run. |
| Active | Running on its schedule or waiting for triggers. |
| Paused | Temporarily stopped. Can be resumed without reconfiguration. |
| Error | Last execution failed. Check logs for details. |

### Validation

The builder validates your automation in real-time:
- Every flow must have exactly one trigger node
- All nodes must be connected (no orphaned nodes)
- Required fields in each node must be filled
- Tool parameters must match the tool's JSON Schema
- Channel references must match configured channels
- Condition expressions must be syntactically valid

Invalid automations cannot be activated. The validation engine highlights errors inline with red borders and descriptive messages.

### Execution History

Each automation keeps a log of past executions. From the Automations page, click on an automation to see:
- Execution timestamps
- Success/failure status
- Which path was taken through condition nodes
- Output from each node
- Duration of each execution

This is useful for debugging automations that are not behaving as expected.

## Workflows

Workflows are multi-step processes that persist across restarts, can pause for human approval, and recover from failures. They are more structured than automations -- think of them as long-running business processes.

### Key Features

| Feature | Description |
|---------|-------------|
| **Persistence** | Workflow state is stored in SQLite. Workflows survive gateway restarts. |
| **Approval gates** | Pause at any step and wait for your explicit approval before continuing. |
| **Retry logic** | Failed steps are retried with exponential backoff (up to 5 retries). |
| **Resume on boot** | When the gateway starts, incomplete workflows resume from their last completed step. |
| **Progress tracking** | See the current step, status, and full history in the Web UI. |

### Workflow States

| State | Description |
|-------|-------------|
| `pending` | Workflow is created but not yet started |
| `running` | Currently executing a step |
| `waiting_approval` | Paused at an approval gate, waiting for user confirmation |
| `completed` | All steps finished successfully |
| `failed` | A step failed after all retries were exhausted |
| `cancelled` | Manually cancelled by the user |

### Creating Workflows

**Web UI**: go to **Workflows** and click **Create Workflow**. Define steps, approval gates, and conditions in the builder.

**Chat**: ask Homun to create one:

> "Create a workflow that: 1) researches competitors for my product, 2) writes a summary report, 3) waits for my approval, 4) posts the report to our Slack channel."

**API**:

```bash
curl -X POST https://localhost:18443/api/v1/workflows \
  -H "Authorization: Bearer wh_your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Competitor Research",
    "steps": [
      {"action": "research", "prompt": "Research competitors..."},
      {"action": "write", "prompt": "Write a summary..."},
      {"action": "approval", "message": "Review the report before posting"},
      {"action": "send", "channel": "slack", "prompt": "Post the report..."}
    ]
  }'
```

### Approval Gates

Approval gates pause the workflow and notify you. They are the key differentiator between workflows and automations -- workflows let you insert human review into automated processes.

You can approve from:

- **Web UI**: go to **Approvals** to see pending approvals with full context of what the workflow has done so far
- **Telegram/Discord/Slack**: Homun sends you a message asking for approval. Reply "approve" or "reject"
- **Email**: if email channel is configured, approval requests can be sent via email
- **API**: `POST /api/v1/approvals/:id/approve` or `POST /api/v1/approvals/:id/reject`

When you approve, the workflow continues from the next step. When you reject, the workflow is cancelled. You can also provide feedback with your approval:

> "Approve, but change the tone to be more formal"

The next step receives your feedback as additional context.

### Approval Timeout

If an approval is not responded to within a configurable timeout, the workflow remains in `waiting_approval` state. It does not auto-approve or auto-reject. The heartbeat can be configured to send reminders about pending approvals.

### Retry Logic

When a step fails (tool error, LLM timeout, network issue), the workflow retries with exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1 | 1 second |
| 2 | 2 seconds |
| 3 | 4 seconds |
| 4 | 8 seconds |
| 5 | 16 seconds |

After 5 failed attempts, the workflow is marked as `failed`. You can manually retry from the failed step in the Web UI. The retry does not re-run previously completed steps.

### Resume on Boot

If the gateway shuts down while a workflow is running, the workflow resumes from its last completed step when the gateway starts back up. This means:
- Steps that completed before shutdown are not re-run
- The step that was in progress when shutdown happened is re-run
- Workflows in `waiting_approval` state continue waiting

## Real-World Examples

### Example 1: Morning Briefing

A cron job that runs at 8:30 AM on weekdays:

```bash
homun cron add "30 8 * * 1-5" "Do my morning briefing: 1) Check emails for anything urgent. 2) Check my calendar for today's events. 3) Check the weather in Milan. 4) Send me a combined summary on Telegram."
```

### Example 2: Content Pipeline

A workflow for publishing blog posts:

1. **Research**: Homun searches the web for recent developments on a topic
2. **Draft**: writes a blog post draft and saves it
3. **Approval gate**: sends you the draft for review
4. **Revision**: incorporates your feedback
5. **Publish**: posts to your CMS via API

### Example 3: Price Monitoring

An automation built in the visual builder:

- **Trigger**: Schedule Trigger, every 6 hours
- **Tool Execution**: Browser tool navigates to product pages, extracts prices
- **Condition**: if price dropped below threshold
  - **True path**: Send Message to Telegram with the new price and link
  - **False path**: no action (flow ends)

### Example 4: Weekly Digest

A cron job that creates a weekly summary:

```bash
homun cron add "0 18 * * 5" "Review everything we discussed this week. Write a concise weekly digest covering: decisions made, action items, and topics to follow up on. Save it to ~/Documents/weekly-digests/"
```

### Example 5: Customer Inquiry Workflow

A workflow for handling incoming customer inquiries:

1. **Classify**: LLM reads the inquiry and categorizes it (support, sales, partnership)
2. **Research**: search knowledge base for relevant documentation
3. **Draft response**: write a reply using the knowledge base context
4. **Approval gate**: show the draft for your review
5. **Send**: forward the approved response via email

## Configuration Reference

### Cron Settings

Cron jobs are managed via CLI and Web UI. There is no global configuration section -- each job has its own schedule and instruction.

### Heartbeat Settings

```toml
[heartbeat]
interval_secs = 3600    # Wake-up interval in seconds (default: 3600 = 1 hour)
```

### Automation Settings

Automations are configured in the Web UI visual builder. They are stored in the SQLite database.

## Troubleshooting

### Cron Job Not Firing

**Symptom**: a scheduled job does not run at the expected time.

**Check**:
1. Verify the gateway is running (`homun gateway`)
2. Check that the cron expression is correct: `homun cron list` shows the next run time
3. Remember that cron uses the server's local timezone, not UTC
4. Look for errors in the logs: `RUST_LOG=debug homun gateway`

### Automation Loop Stuck

**Symptom**: an automation with a Loop node runs indefinitely.

**Cause**: the loop may be iterating over an unexpectedly large list or the exit condition is never met.

**Fix**: check the loop node configuration. Add a maximum iteration limit in the loop settings. Review the data flowing into the loop node in the execution history.

### Workflow Approval Timeout

**Symptom**: a workflow has been in `waiting_approval` for a long time and nobody noticed.

**Fix**: configure the heartbeat to check for pending approvals. Ensure at least one notification channel is active (Telegram, Discord, etc.) so approval requests reach you.

### Missed Cron Jobs During Downtime

**Symptom**: the gateway was down and a scheduled job did not run.

**Explanation**: Homun does not retroactively run missed jobs. If the gateway was down at 9:00 AM when a daily job was scheduled, that execution is skipped. The job runs at the next scheduled time (9:00 AM the following day).

If you need guaranteed execution even during downtime, consider running Homun as an OS service so it automatically restarts.
