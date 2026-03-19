# Configuration

Homun stores its configuration in a single TOML file at `~/.homun/config.toml`. All settings are organized into sections that control different aspects of the system.

## Config File Location

| Platform | Path |
|----------|------|
| macOS / Linux | `~/.homun/config.toml` |
| Custom | Set via `HOMUN_HOME` environment variable |

## Interactive Setup

The fastest way to configure Homun is the interactive wizard:

```bash
homun config
```

This walks you through setting up your LLM provider, channels, and security options.

## Config Sections

The configuration file is organized into these top-level sections:

```toml
[general]
name = "Homun"           # Your assistant's display name
language = "en"           # Default language

[providers]
default = "anthropic/claude-sonnet-4-5-20250514"

[channels]
# Telegram, Discord, Slack, WhatsApp, Email, Web

[security]
# Auth, rate limits, vault

[web]
host = "127.0.0.1"
port = 18443

[browser]
enabled = false
headless = true
```

## Reading and Writing Config

Use the CLI to read or update individual settings with dot-path notation:

```bash
# Read a value
homun config get providers.default

# Set a value
homun config set providers.default "anthropic/claude-sonnet-4-5-20250514"

# Set a nested value
homun config set channels.telegram.token "your-bot-token"
```

## Hot Reload

Some settings take effect immediately without restarting:

| Setting | Requires Restart |
|---------|-----------------|
| LLM provider / model | No |
| Channel tokens | Yes |
| Web UI port | Yes |
| Security settings | Yes |
| Browser config | No |

When in doubt, restart the gateway after changing configuration:

```bash
# Stop the running gateway (Ctrl+C), then restart
homun gateway
```

## Data Directory

Beyond the config file, Homun stores data in `~/.homun/`:

```
~/.homun/
  config.toml        # Configuration
  homun.db           # SQLite database
  secrets.enc        # Encrypted vault
  brain/
    USER.md          # User profile (managed by Homun)
    INSTRUCTIONS.md  # Learned instructions
  memory/
    2025-01-15.md    # Daily memory files
  skills/            # Installed skills
```
