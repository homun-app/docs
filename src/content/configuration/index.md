# Configuration

Homun stores all its settings in a single TOML file. This page covers the file location, the full data directory structure, every method of editing configuration, hot-reload behavior, environment variable overrides, and a complete annotated example.

## Config File Location

The primary configuration file lives at `~/.homun/config.toml`. You can override the data directory with the `HOMUN_HOME` environment variable.

| Platform | Default Path | Override |
|----------|-------------|----------|
| macOS | `~/.homun/config.toml` | `HOMUN_HOME=/custom/path` |
| Linux | `~/.homun/config.toml` | `HOMUN_HOME=/custom/path` |
| Windows | `%USERPROFILE%\.homun\config.toml` | `HOMUN_HOME=C:\custom\path` |
| Docker | `/data/config.toml` | Set via volume mount |

If the file does not exist on first launch, Homun creates it with minimal defaults and prompts you to run the setup wizard.

## File Format

Homun uses **TOML** (Tom's Obvious Minimal Language) for its configuration file. TOML is human-friendly and supports nested sections, arrays, inline tables, and comments. It is not JSON, not YAML. Keys are unquoted unless they contain special characters; strings use double quotes; booleans are `true`/`false`.

```toml
# This is a comment
[section]
key = "value"
number = 42
enabled = true
list = ["one", "two", "three"]

[section.nested]
deep_key = "deep_value"
```

Homun validates the config file on startup. If a section or key is malformed, Homun logs the error and exits with a descriptive message pointing to the invalid line. It never silently ignores invalid configuration.

## Config Sections Overview

The config file is organized into top-level sections. Each section controls a different subsystem.

| Section | Purpose | Required |
|---------|---------|:--------:|
| `[general]` | Agent name, language, behavior | No |
| `[providers]` | LLM provider keys and default model | Yes |
| `[channels.web]` | Web UI host, port, rate limits, session | No |
| `[channels.telegram]` | Telegram bot token | No |
| `[channels.discord]` | Discord bot token | No |
| `[channels.slack]` | Slack app and bot tokens | No |
| `[channels.whatsapp]` | WhatsApp pairing config | No |
| `[channels.email]` | IMAP/SMTP credentials | No |
| `[browser]` | Browser automation (Playwright MCP) | No |
| `[sandbox]` | Shell command sandbox backend | No |
| `[security]` | 2FA, device approval, auth settings | No |
| `[knowledge]` | RAG knowledge base, embeddings, watch dirs | No |
| `[memory]` | Memory consolidation settings | No |
| `[scheduler]` | Heartbeat and proactive wake-up config | No |
| `[mcp]` | MCP server definitions | No |

The only truly required setting is `providers.default` -- without a default model, Homun cannot start the agent loop. Everything else has sensible defaults.

## Data Directory Structure

Beyond the config file, Homun stores all its runtime data in the `~/.homun/` directory. Here is the full structure:

```
~/.homun/
  config.toml            # Main configuration file
  homun.db               # SQLite database (sessions, memories, cron, workflows)
  homun.db-shm           # SQLite shared memory (auto-managed)
  homun.db-wal           # SQLite write-ahead log (auto-managed)
  secrets.enc            # Encrypted vault file (AES-256-GCM)

  brain/
    USER.md              # User profile — updated only by the "remember" tool
    INSTRUCTIONS.md      # Learned behavioral instructions (LLM consolidation)
    SOUL.md              # Agent personality definition (user-editable)

  memory/
    2025-01-15.md         # Daily memory files (one per day)
    2025-01-16.md

  skills/                 # User-installed skills (one subdirectory per skill)
    weather/
      SKILL.md
      scripts/
        fetch.py
    summarizer/
      SKILL.md

  logs/                   # Log files (when file logging is enabled)
    homun.log

  tls/                    # Auto-generated TLS certificates for HTTPS
    cert.pem
    key.pem

  mcp/                    # MCP server configurations and state
```

**Important**: Do not manually edit `homun.db` or `secrets.enc`. Use the CLI, API, or Web UI for all data operations. Editing the database directly can corrupt your data. The `brain/` files and `config.toml` are safe to edit manually.

### Key Files Explained

| File | Safe to Edit | Purpose |
|------|:------------:|---------|
| `config.toml` | Yes | All settings. Edit freely; validated on load. |
| `homun.db` | No | SQLite database holding sessions, memories, cron jobs, automations, workflows, contacts, and usage data. Managed by sqlx with 18 migrations auto-applied on startup. |
| `secrets.enc` | No | AES-256-GCM encrypted vault. Master key stored in your OS keychain. |
| `brain/USER.md` | Yes | Facts Homun has learned about you. Written by the `remember` tool; you can also edit it manually. |
| `brain/SOUL.md` | Yes | Agent personality. Edit this to change how Homun talks and behaves. |
| `brain/INSTRUCTIONS.md` | Yes | Behavioral instructions consolidated from conversations. |
| `memory/*.md` | Yes | Daily conversation summaries. One file per day, Markdown format. |

## How to Edit Configuration

There are four ways to change Homun's configuration.

### Method 1: CLI with Dot-Path Notation

Use `homun config get` and `homun config set` to read and write individual settings. Dot-path notation lets you reach any nested key in the TOML file.

```bash
# Read a top-level key
homun config get general.name

# Read a nested key
homun config get providers.anthropic.api_key

# Set a string value
homun config set providers.default "anthropic/claude-sonnet-4-5-20250514"

# Set a number
homun config set channels.web.port 18444

# Set a boolean
homun config set browser.enabled true

# Set a nested channel token
homun config set channels.telegram.token "123456:ABC-DEF..."

# Set an array (JSON syntax for complex values)
homun config set providers.fallback '["openai/gpt-4o", "ollama/llama3"]'
```

Dot-path notation works by splitting the path on `.` characters and traversing the TOML structure. For example, `channels.telegram.token` maps to:

```toml
[channels.telegram]
token = "123456:ABC-DEF..."
```

After setting a value, Homun writes the updated TOML file atomically. The file is always valid TOML after a write.

Additional config subcommands:

```bash
# Show the full current config
homun config show

# Print the config file path
homun config path

# Initialize a fresh default config (does not overwrite existing)
homun config init
```

### Method 2: Edit the TOML File Directly

Open `~/.homun/config.toml` in any text editor. This is useful for bulk changes or when setting up a new installation from a template.

```bash
# Open in your default editor
$EDITOR ~/.homun/config.toml

# Or use any editor
nano ~/.homun/config.toml
code ~/.homun/config.toml
```

After saving, restart the gateway for changes to take effect (unless the setting supports hot reload).

### Method 3: Web UI Setup Wizard

The Web UI provides a guided configuration experience. On first access, the setup wizard walks you through essential settings. After initial setup, go to **Settings** in the sidebar to change configuration through a form-based interface.

The Web UI writes changes directly to `config.toml` using the same atomic write mechanism as the CLI.

### Method 4: Interactive Wizard (CLI)

Running `homun config` with no subcommand launches an interactive terminal wizard that walks you through all configuration sections:

```bash
homun config
```

This is the recommended approach for initial setup on headless servers where the Web UI is not yet accessible.

## Hot-Reload Behavior

Some settings take effect immediately while the gateway is running. Others require a full restart. The table below lists every configuration section and its reload behavior.

| Section | Setting | Hot Reload | Notes |
|---------|---------|:----------:|-------|
| `[general]` | `name` | Yes | Agent display name updates immediately |
| `[general]` | `language` | Yes | Applied to next conversation |
| `[providers]` | `default` | Yes | Next LLM call uses the new model |
| `[providers]` | `fallback` | Yes | Failover chain updates immediately |
| `[providers.*]` | `api_key` | Yes | New key used on next API call |
| `[providers.*]` | `base_url` | Yes | New endpoint used on next API call |
| `[channels.*]` | All settings | **No** | Channels must be restarted |
| `[channels.web]` | `port`, `host` | **No** | Requires gateway restart |
| `[channels.web]` | Rate limits | Yes | Applied to next request |
| `[security]` | All settings | **No** | Requires gateway restart |
| `[browser]` | `enabled` | Yes | Browser tool appears/disappears |
| `[browser]` | `headless` | Yes | Applied on next browser session |
| `[browser]` | `browser_type` | Yes | Applied on next browser session |
| `[sandbox]` | All settings | Yes | Next command uses new settings |
| `[knowledge]` | `watch_dirs` | **No** | Watcher requires restart |
| `[knowledge]` | `embedding_*` | **No** | Embedding model reload needs restart |
| `[memory]` | All settings | Yes | Applied on next consolidation cycle |
| `[scheduler]` | All settings | **No** | Requires gateway restart |
| `[mcp]` | Server definitions | **No** | MCP servers require restart |

**When in doubt**, restart the gateway after making changes:

```bash
# Stop the running gateway (Ctrl+C), then restart
homun gateway
```

If Homun is running as an OS service:

```bash
homun service stop
homun service start
```

## Environment Variable Overrides

Every configuration key can be overridden using environment variables with the `HOMUN_` prefix. The variable name follows the pattern `HOMUN_SECTION_KEY`, with dots replaced by underscores and all characters uppercased.

```bash
# Override the default provider
export HOMUN_PROVIDERS_DEFAULT="openai/gpt-4o"

# Override the web port
export HOMUN_CHANNELS_WEB_PORT=9443

# Override the Anthropic API key
export HOMUN_PROVIDERS_ANTHROPIC_API_KEY="sk-ant-..."

# Disable the sandbox
export HOMUN_SANDBOX_ENABLED=false
```

Environment variables take precedence over `config.toml` values. This is useful for:

- **Docker deployments** where you pass config via `-e` flags
- **CI/CD pipelines** that inject secrets as environment variables
- **Temporary overrides** without modifying the config file

Homun logs which settings are overridden by environment variables at startup (at `debug` log level).

### Special Environment Variables

These environment variables are not config overrides but control Homun's behavior at a system level:

| Variable | Default | Purpose |
|----------|---------|---------|
| `HOMUN_HOME` | `~/.homun` | Data directory location |
| `RUST_LOG` | `info` | Log verbosity (`error`, `warn`, `info`, `debug`, `trace`) |
| `RUST_LOG` filters | -- | Per-module filtering: `RUST_LOG=homun=debug,sqlx=warn` |
| `NO_COLOR` | unset | Disable colored terminal output when set |

## Config Validation

Homun validates the configuration file at startup and when settings are changed via CLI or API. Validation checks include:

- **TOML syntax**: the file must be valid TOML. Errors show the line number and character position.
- **Type checking**: values must match expected types (string, integer, boolean, array).
- **Required fields**: `providers.default` must be set, or Homun cannot start the agent loop.
- **URL format**: fields like `providers.ollama.base_url` must be valid URLs.
- **Port range**: port numbers must be between 1 and 65535.
- **File paths**: paths like `knowledge.watch_dirs` entries must be accessible directories.
- **Model format**: the `providers.default` value must contain a `/` separator (e.g., `anthropic/claude-sonnet-4-5-20250514`).
- **Cron expressions**: scheduler cron strings must be valid 5-field cron format.

When validation fails, Homun prints a clear error message and exits with a non-zero status code. It never starts with an invalid configuration.

```
Error: invalid config at channels.web.port: expected integer, got string "abc"
  --> ~/.homun/config.toml:12:8
```

### Common Validation Errors

| Error Message | Cause | Fix |
|---------------|-------|-----|
| `missing required field: providers.default` | No default model configured | Set `providers.default = "anthropic/..."` |
| `invalid model format` | Missing `/` in model string | Use format `provider/model-name` |
| `port out of range` | Port not between 1-65535 | Use a valid port number |
| `invalid TOML` | Syntax error in config file | Check for unclosed quotes, missing `=` |
| `unknown section` | Typo in section name | Check spelling against this reference |

## Full Example Config

Below is a complete `config.toml` with all sections and their most common options. Uncomment and modify the sections you need.

```toml
# ── General ─────────────────────────────────────────────
[general]
name = "Homun"                # Display name for your assistant
language = "en"                # Default language (en, it, es, fr, de, pt, ja, zh)

# ── LLM Providers ──────────────────────────────────────
[providers]
default = "anthropic/claude-sonnet-4-5-20250514"
fallback = ["openai/gpt-4o", "ollama/llama3"]

[providers.anthropic]
api_key = "sk-ant-..."

# [providers.openai]
# api_key = "sk-..."

# [providers.ollama]
# base_url = "http://localhost:11434"

# [providers.openrouter]
# api_key = "sk-or-..."

# [providers.deepseek]
# api_key = "sk-..."

# [providers.groq]
# api_key = "gsk_..."

# ── Channels ───────────────────────────────────────────
# [channels.telegram]
# token = "123456:ABC-DEF..."

# [channels.discord]
# token = "your-bot-token"

# [channels.slack]
# app_token = "xapp-..."
# bot_token = "xoxb-..."

# [channels.whatsapp]
# enabled = true

# [channels.email]
# imap_host = "imap.gmail.com"
# imap_port = 993
# smtp_host = "smtp.gmail.com"
# smtp_port = 587
# username = "you@gmail.com"
# password = "app-password"

# ── Web UI ─────────────────────────────────────────────
[channels.web]
host = "127.0.0.1"             # Bind address (use 127.0.0.1 for local only)
port = 18443                   # HTTPS port
# session_ttl_secs = 86400    # Session lifetime (default: 24 hours)
# trust_x_forwarded_for = false
# require_device_approval = false
# auth_rate_limit_per_minute = 5
# api_rate_limit_per_minute = 60

# ── Security ───────────────────────────────────────────
# [security]
# require_2fa = false

# ── Browser ────────────────────────────────────────────
[browser]
enabled = false
headless = true
# browser_type = "chromium"    # chromium, firefox, or webkit
# executable = "/path/to/chrome"  # Custom browser binary

# ── Sandbox ────────────────────────────────────────────
[sandbox]
enabled = true
# backend = "auto"            # auto, docker, native, bubblewrap
# timeout_secs = 30           # Max execution time per command
# allow_network = false       # Allow network access in sandbox

# ── Memory ─────────────────────────────────────────────
# [memory]
# consolidation_enabled = true
# consolidation_interval_hours = 24

# ── Scheduler ──────────────────────────────────────────
# [scheduler]
# heartbeat_enabled = true
# heartbeat_interval_mins = 30

# ── Knowledge Base ─────────────────────────────────────
# [knowledge]
# watch_dirs = ["~/Documents/notes", "~/Projects/docs"]
# embedding_provider = "fastembed"   # fastembed (local) or openai
```

## Migrating from Older Configs

Homun applies database migrations automatically on startup. For config file changes between versions:

- New config keys are optional and have defaults. Upgrading Homun never breaks your existing `config.toml`.
- Deprecated keys are logged as warnings at startup but still work for at least one major version.
- If a key is renamed, Homun reads both the old and new name, preferring the new one.

There is no manual migration step required. Just update the Homun binary, and existing configs continue to work.

## Next Steps

- **[LLM Providers](/configuration/providers)** -- configure your AI model and failover chain
- **[Security](/configuration/security)** -- authentication, vault, 2FA, and emergency controls
- **[Remote Access](/configuration/remote-access)** -- expose Homun over the network safely
