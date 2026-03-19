# Built-in Tools

Homun comes with 20+ built-in tools that the agent uses to interact with your system, the web, and external services. Tools are invoked automatically based on what you ask.

## System Tools

| Tool | Description |
|------|-------------|
| **shell** | Execute system commands (runs inside [sandbox](/features/sandbox) by default) |
| **file** | Read, write, edit, and list files on your filesystem |
| **vault** | Store and retrieve encrypted secrets |
| **approval** | Request your confirmation before taking sensitive actions |

## Communication

| Tool | Description |
|------|-------------|
| **message** | Send a message to you on any connected channel |
| **email_inbox** | Read emails via IMAP |

## Web & Search

| Tool | Description |
|------|-------------|
| **web_search** | Search the web using Brave Search or Tavily |
| **web_fetch** | Fetch and parse web page content |
| **browser** | Full browser automation (see [Browser Automation](/features/browser)) |

## Memory & Knowledge

| Tool | Description |
|------|-------------|
| **remember** | Save important information to your user profile |
| **knowledge** | Search, ingest, and list documents in the knowledge base |

## Automation

| Tool | Description |
|------|-------------|
| **spawn** | Create a background subagent for parallel tasks |
| **cron** | Schedule recurring tasks |
| **automation** | Create and manage visual automations |
| **workflow** | Build multi-step workflows with approval gates |

## Skills & Extensions

| Tool | Description |
|------|-------------|
| **skill_create** | Generate new skills using the LLM |
| **mcp** | Manage MCP (Model Context Protocol) servers |

## How Tools Work

You do not need to invoke tools directly. When you make a request, Homun's agent loop decides which tools are needed and calls them automatically. You see the tool execution in the chat timeline.

For example, asking "What's the weather in Tokyo?" might trigger:

1. `web_search` -- search for current weather
2. `web_fetch` -- read the weather page
3. `message` -- send you the result

## Tool Approval

Some actions require your confirmation before executing. When this happens, Homun pauses and asks for your approval. You can configure the autonomy level to control how much Homun can do without asking.
