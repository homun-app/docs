# CLI

The CLI channel lets you interact with Homun directly from your terminal. No gateway or network connection required.

## Interactive Mode

Start a conversation:

```bash
homun
```

or equivalently:

```bash
homun chat
```

Type your messages and press Enter. Responses stream in real-time. Press `Ctrl+C` to exit.

## One-Shot Mode

Send a single message and get the response:

```bash
homun chat -m "What's the capital of Japan?"
```

This is useful for scripting and automation. The process exits after the response is complete.

## Scripting Examples

Use Homun in shell scripts and pipelines:

```bash
# Summarize a file
cat report.txt | homun chat -m "Summarize this document"

# Generate a commit message
git diff --staged | homun chat -m "Write a commit message for these changes"

# Quick lookup
homun chat -m "Convert 100 USD to EUR"
```

## Features

- **Streaming output** -- responses appear as they are generated
- **Local execution** -- connects directly to the LLM provider, no gateway needed
- **Full tool access** -- all agent tools are available (shell, files, web search, etc.)
- **Session memory** -- interactive mode maintains context within the session

## Configuration

The CLI uses the same `~/.homun/config.toml` as the gateway. At minimum, you need an LLM provider configured:

```toml
[provider]
default_model = "anthropic/claude-sonnet-4-20250514"

[provider.anthropic]
api_key = "sk-ant-..."
```

## TUI Mode

For a richer terminal experience, Homun includes a TUI (Terminal User Interface) with a full-screen layout, scrollable history, and status bar:

```bash
homun tui
```
