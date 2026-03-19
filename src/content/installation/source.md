# Build from Source

Build Homun directly from source for maximum control and performance.

## Prerequisites

- **Rust 1.75+** -- install via [rustup](https://rustup.rs/)
- **System dependencies**:
  - macOS: Xcode Command Line Tools (`xcode-select --install`)
  - Ubuntu/Debian: `build-essential pkg-config libssl-dev libsqlite3-dev`
  - Fedora: `gcc openssl-devel sqlite-devel`

## Build

1. **Clone the repository**

```bash
git clone https://github.com/homunbot/homunbot.git
cd homunbot
```

2. **Build the release binary**

```bash
cargo build --release
```

The binary will be at `target/release/homun`.

3. **Optional: install globally**

```bash
cargo install --path .
```

This places `homun` in `~/.cargo/bin/`, which should be in your `PATH`.

## First Run

1. **Initialize configuration**

```bash
homun config
```

This creates `~/.homun/config.toml` with default settings. Edit it to add your LLM provider:

```toml
[provider]
default_model = "anthropic/claude-sonnet-4-20250514"

[provider.anthropic]
api_key = "sk-ant-..."
```

2. **Start the gateway**

```bash
homun gateway
```

This starts the Web UI, all configured channels, scheduled tasks, and the heartbeat system.

3. **Open the Web UI**

Navigate to [http://localhost:18080](http://localhost:18080) to complete setup.

## File Locations

| Path | Purpose |
|---|---|
| `~/.homun/config.toml` | Configuration file |
| `~/.homun/homun.db` | SQLite database |
| `~/.homun/secrets.enc` | Encrypted vault |
| `~/.homun/brain/` | Agent memory (USER.md, SOUL.md) |
| `~/.homun/skills/` | Installed skills |

## Quick Chat (no gateway)

For a quick interactive session without starting the full gateway:

```bash
homun chat
```

Or send a one-shot message:

```bash
homun chat -m "What's the weather in Rome?"
```

## Verbose Logging

```bash
RUST_LOG=debug homun gateway
```
