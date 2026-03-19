# CLI Commands

Homun is controlled through a single binary with subcommands for chat, configuration, and management.

## Chat

```bash
# Start interactive chat (default command)
homun

# Explicit interactive chat
homun chat

# Send a one-shot message and get a response
homun chat -m "What time is it in Tokyo?"
```

## Gateway

Start all services: messaging channels, cron scheduler, heartbeat, and the Web UI.

```bash
homun gateway
```

This is the main command for running Homun as a persistent service. It keeps running until stopped with `Ctrl+C`.

## Configuration

```bash
# Interactive configuration wizard
homun config

# Read a config value
homun config get providers.default

# Set a config value
homun config set providers.default "anthropic/claude-sonnet-4-5-20250514"
```

Dot-path notation lets you access nested config values like `channels.telegram.token` or `web.port`.

## Status

```bash
# Show system status
homun status
```

Displays the current state of the agent, connected channels, active cron jobs, and provider health.

## Skills

```bash
# List installed skills
homun skills list

# Install a skill from GitHub
homun skills add owner/repo

# Remove a skill
homun skills remove skill-name
```

## Cron Jobs

```bash
# List scheduled jobs
homun cron list

# Schedule a recurring task
homun cron add "0 9 * * *" "Check my emails and summarize them"

# Remove a scheduled job
homun cron remove <job-id>
```

Cron expressions use the standard 5-field format: `minute hour day-of-month month day-of-week`.

## Vault

```bash
# Store an encrypted secret
homun vault set MY_API_KEY "sk-secret-value"

# Retrieve a secret
homun vault get MY_API_KEY

# List all secret names
homun vault list

# Remove a secret
homun vault remove MY_API_KEY
```

## OS Service

Install Homun as a system service so it starts automatically on boot:

```bash
# Install as service (launchd on macOS, systemd on Linux)
homun service install

# Remove the service
homun service uninstall
```

## Global Options

| Flag | Description |
|------|-------------|
| `--verbose` / `-v` | Enable debug logging |
| `--config <path>` | Use a custom config file |
| `--help` / `-h` | Show help |
| `--version` / `-V` | Show version |
