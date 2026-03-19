# CLI Commands

Homun is controlled through a single binary with subcommands for chat, service management, configuration, skills, and more. Running `homun` with no subcommand starts interactive chat.

## Command Overview

```
homun                    Interactive chat (default)
homun chat               Interactive chat or one-shot message
homun gateway            Start all services (channels, cron, web UI)
homun config             Configuration management
homun provider           LLM provider management
homun status             Show system status
homun skills             Skill management (install, remove, search)
homun cron               Cron job management
homun automations        Automation management
homun mcp                MCP server management
homun memory             Memory management
homun knowledge          Knowledge base (RAG) management
homun vault              Encrypted secret storage
homun users              User and identity management
homun service            OS service management (auto-start)
homun stop               Stop the running gateway
homun restart            Restart the gateway
homun version            Show version
```

## Chat

Start an interactive conversation or send a one-shot message.

```bash
# Start interactive chat (default command when no subcommand given)
homun

# Explicit interactive chat
homun chat

# Send a one-shot message and get a response
homun chat -m "What time is it in Tokyo?"
```

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--message` | `-m` | Send a single message and exit |

In interactive mode, type your message and press Enter. The agent responds with streaming output. Type `exit` or press `Ctrl+D` to quit.

### Examples

```bash
# Quick question
homun chat -m "Convert 100 USD to EUR"

# Interactive session for complex tasks
homun chat
> Help me write a Python script to parse CSV files
> Now add error handling for missing columns
> exit
```

## Gateway

Start all services: messaging channels, cron scheduler, heartbeat, and the Web UI.

```bash
homun gateway
```

This is the main command for running Homun as a persistent service. It keeps running until stopped with `Ctrl+C` (graceful) or double `Ctrl+C` (E-Stop).

The gateway starts:
- Web UI on the configured port (default: 18443)
- All configured messaging channels (Telegram, Discord, Slack, WhatsApp, Email)
- Cron scheduler for scheduled jobs and automations
- Heartbeat for proactive wake-ups
- MCP server connections
- Knowledge base file watcher (if configured)

### Verbose Mode

```bash
# Debug logging for troubleshooting
RUST_LOG=debug homun gateway

# Per-module filtering
RUST_LOG=homun=debug,sqlx=warn homun gateway
```

## Configuration

Manage the `config.toml` file through the CLI.

```bash
# Launch interactive configuration wizard (TUI dashboard)
homun config

# Show current configuration
homun config show

# Get a config value by dot-path
homun config get providers.default
homun config get channels.web.port
homun config get providers.anthropic.api_key

# Set a config value by dot-path
homun config set providers.default "anthropic/claude-sonnet-4-5-20250514"
homun config set channels.web.port 18444
homun config set browser.enabled true

# Set an array value (JSON syntax)
homun config set providers.fallback '["openai/gpt-4o", "ollama/llama3"]'

# Initialize default configuration (does not overwrite existing)
homun config init

# Show config file path
homun config path
```

### Subcommands

| Subcommand | Description |
|------------|-------------|
| (none) | Launch interactive wizard |
| `show` | Print current configuration |
| `get <key>` | Read a value by dot-path |
| `set <key> <value>` | Write a value by dot-path |
| `init` | Create default config if none exists |
| `path` | Print the config file path |

### Dot-Path Examples

Dot-path notation maps directly to the TOML file structure:

| Dot-Path | TOML Equivalent |
|----------|----------------|
| `general.name` | `[general]` `name = "..."` |
| `providers.default` | `[providers]` `default = "..."` |
| `providers.anthropic.api_key` | `[providers.anthropic]` `api_key = "..."` |
| `channels.web.port` | `[channels.web]` `port = ...` |
| `channels.telegram.token` | `[channels.telegram]` `token = "..."` |
| `browser.enabled` | `[browser]` `enabled = ...` |
| `sandbox.backend` | `[sandbox]` `backend = "..."` |

## Provider Management

Manage LLM provider configurations.

```bash
# List all providers and their health status
homun provider list

# Add a provider with API key
homun provider add anthropic --api-key "sk-ant-..."

# Add a provider with custom base URL
homun provider add openai --api-key "sk-..." --api-base "https://proxy.example.com/v1"

# Remove a provider
homun provider remove deepseek
```

### Subcommands

| Subcommand | Description |
|------------|-------------|
| `list` | Show all providers, their status, and health |
| `add <name>` | Configure a provider |
| `remove <name>` | Remove a provider's configuration |

### Add Flags

| Flag | Description |
|------|-------------|
| `--api-key <key>` | API key for the provider |
| `--api-base <url>` | Custom base URL |

## Status

Show the current state of the system.

```bash
homun status
```

Displays:
- Agent status (running, stopped, paused)
- Default model and provider health
- Connected channels and their status
- Active cron jobs count
- Running workflows count
- Memory and session statistics

## Skills

Manage installed skills -- install from GitHub or ClawHub, search, inspect, and remove.

```bash
# List installed skills
homun skills list

# Show details of an installed skill
homun skills info weather

# Install a skill from GitHub
homun skills add owner/repo

# Install from ClawHub marketplace
homun skills add clawhub:owner/skill-name

# Force install (skip security scan)
homun skills add owner/repo --force

# Search for skills on GitHub
homun skills search "weather forecast" --limit 10

# Search on ClawHub marketplace (3000+ skills)
homun skills hub "web scraper" --limit 20

# Remove a skill
homun skills remove weather
```

### Subcommands

| Subcommand | Description |
|------------|-------------|
| `list` | List all installed skills |
| `info <name>` | Show details of an installed skill |
| `add <repo>` | Install a skill (GitHub: `owner/repo`, ClawHub: `clawhub:owner/skill`) |
| `remove <name>` | Remove an installed skill |
| `search <query>` | Search GitHub for skills |
| `hub <query>` | Search ClawHub marketplace |

### Add Flags

| Flag | Description |
|------|-------------|
| `--force` | Skip the post-download security scan |

### Search Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--limit` | 10 (search) / 20 (hub) | Maximum results to show |

## Cron Jobs

Schedule recurring tasks that Homun executes automatically.

```bash
# List scheduled jobs
homun cron list

# Add a cron job with cron expression
homun cron add --name "morning-news" --message "Check top tech news and summarize" --cron "0 9 * * *"

# Add a job that runs every N seconds
homun cron add --name "health-check" --message "Check server status" --every 3600

# Remove a job
homun cron remove <job-id>
```

### Subcommands

| Subcommand | Description |
|------------|-------------|
| `list` | List all scheduled jobs with their status |
| `add` | Create a new cron job |
| `remove <id>` | Remove a cron job by ID |

### Add Flags

| Flag | Description |
|------|-------------|
| `--name <name>` | Job name (required) |
| `--message <msg>` | The prompt to send to the agent (required) |
| `--cron <expr>` | Cron expression (5-field: `min hour dom month dow`) |
| `--every <secs>` | Run every N seconds (alternative to cron) |

### Cron Expression Format

Standard 5-field format: `minute hour day-of-month month day-of-week`

| Expression | Meaning |
|------------|---------|
| `0 9 * * *` | Every day at 9:00 AM |
| `0 9 * * 1-5` | Weekdays at 9:00 AM |
| `*/30 * * * *` | Every 30 minutes |
| `0 0 1 * *` | First day of every month at midnight |
| `0 8,12,18 * * *` | At 8 AM, noon, and 6 PM daily |

## Automations

Manage automations -- scheduled tasks with delivery targets, trigger conditions, and execution history.

```bash
# List automations
homun automations list

# Create an automation
homun automations add \
  --name "Daily Digest" \
  --prompt "Summarize my emails and calendar for today" \
  --cron "0 8 * * 1-5" \
  --deliver-to "telegram:123456"

# Create with trigger condition
homun automations add \
  --name "Price Alert" \
  --prompt "Check BTC price" \
  --every 3600 \
  --trigger contains \
  --trigger-value "above 100000"

# Create as disabled
homun automations add --name "Test" --prompt "ping" --disabled

# Toggle automation on/off
homun automations toggle <id>

# Run immediately
homun automations run <id>

# View execution history
homun automations history <id> --limit 20

# Remove an automation
homun automations remove <id>
```

### Add Flags

| Flag | Description |
|------|-------------|
| `--name <name>` | Automation name (required) |
| `--prompt <text>` | Instructions for the agent (required) |
| `--cron <expr>` | Cron expression for scheduling |
| `--every <secs>` | Run every N seconds |
| `--deliver-to <target>` | Delivery target: `channel:chat_id` (default: `cli:default`) |
| `--trigger <type>` | Trigger condition: `always`, `on_change`, `contains` |
| `--trigger-value <val>` | Value for `contains` trigger |
| `--disabled` | Create as disabled |

## MCP Servers

Manage Model Context Protocol (MCP) server connections.

```bash
# List configured MCP servers
homun mcp list

# List available MCP setup presets (curated catalog)
homun mcp catalog

# Add an MCP server manually
homun mcp add my-server --command "npx" --args "-y" "@modelcontextprotocol/server-github"

# Add with HTTP transport
homun mcp add my-api --transport http --url "https://api.example.com/mcp"

# Guided setup for a known service
homun mcp setup github
homun mcp setup gmail --env "GMAIL_TOKEN=your-token"

# Setup with custom name and options
homun mcp setup notion --name my-notion --env "NOTION_KEY=secret_..." --skip-test

# Remove an MCP server
homun mcp remove my-server

# Enable/disable an MCP server
homun mcp toggle my-server
```

### Subcommands

| Subcommand | Description |
|------------|-------------|
| `list` | List configured MCP servers and their status |
| `catalog` | Show curated MCP service presets |
| `add <name>` | Add an MCP server manually |
| `setup <service>` | Guided setup for a known MCP service |
| `remove <name>` | Remove an MCP server |
| `toggle <name>` | Enable or disable an MCP server |

### Add Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--transport` | `stdio` | Transport type: `stdio` or `http` |
| `--command` | -- | Command to run (stdio transport) |
| `--args` | -- | Arguments for the command |
| `--url` | -- | Server URL (http transport) |

### Setup Flags

| Flag | Description |
|------|-------------|
| `--name <name>` | Override the default server name |
| `--env <KEY=VALUE>` | Environment variables (repeatable) |
| `--overwrite` | Overwrite existing server with same name |
| `--skip-test` | Skip post-setup connection test |

## Memory

Manage the agent's memory system.

```bash
# Show memory statistics
homun memory status

# Reset all memory (conversations, facts, brain files)
homun memory reset

# Reset without confirmation prompt
homun memory reset --force
```

### Subcommands

| Subcommand | Description |
|------------|-------------|
| `status` | Show memory statistics (conversation count, fact count, file sizes) |
| `reset` | Reset all memory data |

**Warning**: `memory reset` deletes all conversation history, learned facts, and brain files. This cannot be undone.

## Knowledge Base (RAG)

Manage the knowledge base for Retrieval-Augmented Generation.

```bash
# Add a file to the knowledge base
homun knowledge add ~/Documents/handbook.pdf

# Add a directory recursively
homun knowledge add ~/Projects/docs --recursive

# List indexed sources
homun knowledge list

# Search the knowledge base
homun knowledge search "deployment checklist" --limit 5

# Remove an indexed source
homun knowledge remove <source-id>

# Sync resources from MCP cloud sources
homun knowledge sync
homun knowledge sync google-drive
```

### Subcommands

| Subcommand | Description |
|------------|-------------|
| `add <path>` | Ingest a file or directory |
| `list` | List all indexed sources |
| `search <query>` | Search the knowledge base |
| `remove <id>` | Remove a source by ID |
| `sync [server]` | Sync from MCP cloud sources |

### Add Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--recursive` | `-r` | Recurse into subdirectories |

### Search Flags

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--limit` | `-l` | 5 | Maximum results |

## Vault

Manage the encrypted secret vault.

```bash
# Store an encrypted secret
homun vault set MY_API_KEY "sk-secret-value"

# Retrieve a secret
homun vault get MY_API_KEY

# List all secret names (values not shown)
homun vault list

# Remove a secret
homun vault remove MY_API_KEY
```

See [Security > Encrypted Vault](/configuration/security#encrypted-vault) for details on how encryption works.

## Users

Manage users, channel identities, and webhook tokens.

```bash
# List all users
homun users list

# Create a new user
homun users add alice

# Create an admin user
homun users add bob --admin

# Show user details
homun users info alice

# Link a channel identity to a user
homun users link --user alice --channel telegram --id "123456789" --display-name "Alice"

# Unlink a channel identity
homun users unlink --user alice --channel telegram --id "123456789"

# Create a webhook token for a user
homun users token --user alice --name "zapier-integration"

# Delete a user
homun users remove alice
```

### Subcommands

| Subcommand | Description |
|------------|-------------|
| `list` | List all users |
| `add <name>` | Create a new user |
| `info <user>` | Show user details and linked identities |
| `link` | Link a channel identity to a user |
| `unlink` | Unlink a channel identity |
| `token` | Create a webhook token |
| `remove <user>` | Delete a user |

### Add Flags

| Flag | Description |
|------|-------------|
| `--admin` | Make the user an admin |

### Link Flags

| Flag | Description |
|------|-------------|
| `--user <name>` | Username or ID |
| `--channel <type>` | Channel type: `telegram`, `discord`, `whatsapp`, `webhook` |
| `--id <platform_id>` | Platform-specific user ID |
| `--display-name <name>` | Optional display name |

## OS Service

Install Homun as a system service so it starts automatically on boot.

```bash
# Install as service (launchd on macOS, systemd on Linux)
homun service install

# Uninstall the service
homun service uninstall

# Start the service
homun service start

# Stop the service
homun service stop

# Show service status
homun service status
```

### Platform Behavior

| Platform | Service Manager | Service File Location |
|----------|-----------------|----------------------|
| macOS | launchd | `~/Library/LaunchAgents/com.homun.gateway.plist` |
| Linux | systemd | `~/.config/systemd/user/homun.service` |

The service runs as your user (not root). It starts `homun gateway` and restarts automatically on failure.

## Stop and Restart

Control a running gateway remotely (when running as a service or in another terminal).

```bash
# Gracefully stop the running gateway
homun stop

# Restart the gateway (stop + start)
homun restart
```

## Global Options

These flags work with any subcommand:

| Flag | Short | Description |
|------|-------|-------------|
| `--verbose` | `-v` | Enable debug logging |
| `--config <path>` | -- | Use a custom config file path |
| `--help` | `-h` | Show help for the command |
| `--version` | `-V` | Show version number |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOMUN_HOME` | `~/.homun` | Data directory location |
| `RUST_LOG` | `info` | Log level: `error`, `warn`, `info`, `debug`, `trace` |
| `NO_COLOR` | unset | Disable colored terminal output |
| `HOMUN_PROVIDERS_DEFAULT` | -- | Override default model |
| `HOMUN_CHANNELS_WEB_PORT` | -- | Override web UI port |

Any config key can be overridden via environment variable with the `HOMUN_` prefix. See [Configuration > Environment Variable Overrides](/configuration#environment-variable-overrides).

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error (check stderr for details) |
| 2 | Invalid arguments or usage |

## Shell Completion

Generate shell completions for tab-completion of commands and flags:

```bash
# Bash
homun completions bash > ~/.local/share/bash-completion/completions/homun

# Zsh
homun completions zsh > ~/.zfunc/_homun

# Fish
homun completions fish > ~/.config/fish/completions/homun.fish
```

After installing completions, restart your shell or source the completion file.

## Scripting Examples

### Send a Message and Capture Output

```bash
# Get a response as plain text
response=$(homun chat -m "What is 2+2?")
echo "$response"
```

### Check If Gateway Is Running

```bash
if homun status > /dev/null 2>&1; then
  echo "Homun is running"
else
  echo "Homun is not running"
fi
```

### Backup Configuration

```bash
cp ~/.homun/config.toml ~/.homun/config.toml.bak
homun config show > ~/homun-config-export.txt
```

### Batch Install Skills

```bash
for skill in owner/skill1 owner/skill2 owner/skill3; do
  homun skills add "$skill"
done
```
