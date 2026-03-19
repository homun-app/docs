# Automations & Workflows

Homun can run tasks on a schedule, respond to triggers automatically, and execute multi-step workflows with approval gates.

## Cron Jobs

Schedule recurring tasks with cron expressions:

```bash
# Add a daily task at 9 AM
homun cron add "0 9 * * *" "Check my emails and summarize anything important"

# Add a weekly task (Mondays at 8:30 AM)
homun cron add "30 8 * * 1" "Review my calendar for the week"

# List all scheduled jobs
homun cron list

# Remove a job
homun cron remove <id>
```

Cron expressions use the standard 5-field format: `minute hour day-of-month month day-of-week`.

| Example | Schedule |
|---------|----------|
| `0 9 * * *` | Every day at 9:00 AM |
| `0 9 * * 1-5` | Weekdays at 9:00 AM |
| `30 8 * * 1` | Every Monday at 8:30 AM |
| `0 0 1 * *` | First day of each month at midnight |

## Visual Automations

The Web UI includes a visual flow builder for creating automations without writing code. Access it under **Automations**.

### How It Works

Automations are built as flows with connected nodes:

1. **Trigger** -- what starts the automation (schedule, webhook, event)
2. **Conditions** -- filter or branch based on criteria
3. **Actions** -- what Homun does (send message, run tool, call LLM)

### Node Types

The builder supports 11 node kinds including triggers, conditions, LLM calls, tool executions, delays, and branches.

### NLP Generation

Describe what you want in plain language and Homun creates the automation flow for you:

> "Every morning at 9 AM, check my emails. If there's anything urgent, send me a Telegram message."

The generated flow can be reviewed and edited in the visual builder before activation.

## Workflows

Workflows are multi-step processes that persist across restarts and can pause for human approval.

### Key Features

- **Approval gates** -- pause execution and wait for user confirmation before proceeding
- **Retry logic** -- automatically retry failed steps with backoff
- **Resume on boot** -- workflows survive restarts and continue from where they left off
- **Progress tracking** -- see the current step and status in the Web UI

### Creating Workflows

Create workflows through the Web UI under **Workflows**, or ask Homun to set one up:

> "Create a workflow that researches a topic, writes a summary, and waits for my approval before posting it."

Workflows appear in the Web UI where you can monitor progress, approve pending steps, and view execution history.
