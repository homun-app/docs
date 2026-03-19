# Built-in Tools

Homun comes with 20+ built-in tools that the agent uses to interact with your system, the web, and external services. Tools are the actions Homun can take -- reading files, searching the web, sending messages, running commands, and more. You do not need to invoke tools directly; the agent decides which tools to use based on your request.

## How Tools Work

When you send a message, Homun's agent loop follows a ReAct (Reason-Act-Observe) cycle:

1. **Reason**: the LLM analyzes your request and decides what tool to use
2. **Act**: the tool is executed with specific parameters
3. **Observe**: the tool's result is fed back to the LLM
4. **Repeat**: if more actions are needed, the cycle continues

This cycle continues until the agent has enough information to answer your question or complete your task. A single request may trigger one tool or a chain of several tools working together.

### Tool Execution Visibility

In the Web UI, every tool call is visible in the chat timeline. You can expand each call to see:
- Which tool was called and with what parameters
- The tool's output
- How long the call took
- Whether it succeeded or failed

This transparency lets you understand exactly what Homun did and why.

## Tool Categories

### File System

| Tool | Description |
|------|-------------|
| **file** | Read, write, edit, and list files on your filesystem |

The `file` tool supports four operations:

- **read**: read the contents of a file. Works with text files, code, configuration files, etc.
- **write**: create a new file or overwrite an existing one
- **edit**: make precise edits to a file using string replacement (find and replace). Safer than overwriting the entire file.
- **list**: list files and directories at a given path

File operations respect the sandbox configuration when enabled. In sandboxed mode, file access is restricted to allowed directories.

Example interactions:
> "Read the config file at ~/project/config.toml"
> "Create a new Python script at ~/scripts/backup.py"
> "Replace the database URL in my config file"
> "List all files in ~/Documents/reports/"

### Shell

| Tool | Description |
|------|-------------|
| **shell** | Execute system commands |

The shell tool runs commands on your system. By default, commands execute inside the [sandbox](/features/sandbox) for safety. The sandbox restricts filesystem access, network access, and process capabilities.

Homun can run any command you would run in a terminal: git operations, package managers, build tools, scripts, system utilities, and more.

Example interactions:
> "Run the tests for my project"
> "Check the disk usage on this machine"
> "Install the ripgrep package"
> "Run git status in ~/Projects/myapp"

The shell tool captures both stdout and stderr, so the agent sees the full output including error messages.

### Web & Search

| Tool | Description |
|------|-------------|
| **web_search** | Search the web using Brave Search or Tavily |
| **web_fetch** | Fetch and parse web page content |
| **browser** | Full browser automation (17 actions) |

**web_search** performs a web search and returns results with titles, URLs, and snippets. Configure your preferred search provider:

```toml
[search]
provider = "brave"    # or "tavily"
api_key = "your-api-key"
```

**web_fetch** downloads a web page and extracts its text content. It handles HTML parsing, removing navigation, ads, and boilerplate to return the main content. Useful for reading articles, documentation, and simple pages.

**browser** provides full browser automation with 17 actions (navigate, click, type, screenshot, etc.). See the [Browser Automation](/features/browser) page for details. Use this for JavaScript-heavy sites, forms, and interactive pages.

Example interactions:
> "Search the web for Rust async best practices"
> "Fetch the content of https://example.com/docs/api"
> "Go to the admin panel and check the latest metrics"

### Communication

| Tool | Description |
|------|-------------|
| **message** | Send a message to you on any connected channel |
| **email_inbox** | Read emails via IMAP |

**message** sends a proactive message to you on a specified channel (Telegram, Discord, Slack, Email, Web). This is used by cron jobs, automations, and the heartbeat to reach you outside of an active conversation.

**email_inbox** reads emails from your configured IMAP account. It can list messages, read specific emails, search by subject or sender, and check for new mail. Configuration:

```toml
[channels.email]
imap_host = "imap.gmail.com"
imap_port = 993
imap_username = "you@gmail.com"
imap_password = "your-app-password"
smtp_host = "smtp.gmail.com"
smtp_port = 587
smtp_username = "you@gmail.com"
smtp_password = "your-app-password"
```

Example interactions:
> "Check my emails for anything from the accounting team"
> "Send me a Telegram message with today's summary"
> "Read the latest email from john@example.com"

### Memory & Knowledge

| Tool | Description |
|------|-------------|
| **remember** | Save important information to your user profile |
| **knowledge** | Search, ingest, and list documents in the knowledge base |

**remember** writes facts to your user profile (`~/.homun/brain/USER.md`). This is the primary way Homun learns persistent information about you. The tool is smart about updates -- it adds new information, updates changed facts, and avoids duplicates.

**knowledge** interacts with the RAG knowledge base. It supports three operations:
- **search**: find relevant content in ingested documents
- **ingest**: add a new document to the knowledge base
- **list**: show all ingested documents

See the [Memory & Knowledge](/features/memory) page for details on the memory architecture and RAG system.

Example interactions:
> "Remember that my preferred deployment window is Tuesday 2-4 PM"
> "Search my knowledge base for the API authentication docs"
> "Add this PDF to the knowledge base"

### Security

| Tool | Description |
|------|-------------|
| **vault** | Store and retrieve encrypted secrets |
| **approval** | Request your confirmation before taking sensitive actions |

**vault** manages Homun's encrypted secret store. Secrets are encrypted with AES-256-GCM and the master key is stored in your OS keychain. The vault is used for API keys, tokens, passwords, and any other sensitive values.

Operations:
- **set**: store a new secret
- **get**: retrieve a secret (only used internally by skills and tools)
- **delete**: remove a secret
- **list**: show stored secret names (not values)

**approval** pauses execution and asks for your confirmation. This is used before sensitive actions (deleting files, sending emails, making purchases). You can approve or reject from any connected channel.

Example interactions:
> "Store my GitHub token in the vault"
> "What secrets are stored in the vault?"

### Automation

| Tool | Description |
|------|-------------|
| **spawn** | Create a background subagent for parallel tasks |
| **cron** | Schedule recurring tasks |
| **automation** | Create and manage visual automations |
| **workflow** | Build multi-step workflows with approval gates |

**spawn** creates a background subagent that runs independently from the current conversation. This is useful for long-running tasks that should not block the chat. The subagent has access to all tools and memory.

**cron** manages scheduled tasks. See the [Automations & Workflows](/features/automations) page for cron syntax and examples.

**automation** creates and manages visual automations (the flow-based system in the Web UI).

**workflow** creates and manages persistent multi-step workflows with approval gates, retry logic, and resume-on-boot.

Example interactions:
> "Run a background task to research competitors while we continue chatting"
> "Schedule a daily email check at 9 AM"
> "Create a workflow for content review and publishing"

### Skills & Extensions

| Tool | Description |
|------|-------------|
| **skill_create** | Generate new skills using the LLM |
| **mcp** | Manage MCP (Model Context Protocol) servers |

**skill_create** generates a complete skill package (SKILL.md, scripts, frontmatter) from a natural language description. The generated skill is saved to `~/.homun/skills/` and immediately available.

**mcp** manages external MCP servers that extend Homun with additional tools. MCP is a protocol that lets AI assistants connect to external tool servers. Homun can discover, install, and manage MCP servers:

- **list**: show connected MCP servers and their tools
- **install**: install a new MCP server from the registry
- **remove**: disconnect an MCP server

See the [MCP Servers](/features/mcp) page for details.

Example interactions:
> "Create a skill that monitors my GitHub notifications"
> "List all connected MCP servers"
> "Install the Postgres MCP server so you can query my database"

## Tool Combinations

The power of Homun's tool system comes from combining tools in a single request. Here are common combinations:

**Research and report**: web_search + web_fetch + file (write)
> "Research the top 5 Rust web frameworks, compare them, and save the comparison to ~/reports/frameworks.md"

**Monitor and alert**: browser + message
> "Check the status page at example.com. If any service is down, send me a Telegram alert."

**Code review and fix**: file (read) + shell + file (edit)
> "Review the code in src/auth.rs, run the tests, and fix any failing tests."

**Knowledge-augmented answers**: knowledge (search) + message
> "Based on our project documentation, what is the deployment procedure for the API service?"

**Background research**: spawn + web_search + web_fetch + knowledge (ingest)
> "In the background, research recent Rust async developments and add the best articles to my knowledge base."

## Adding Custom Tools via MCP

Beyond the built-in tools, you can extend Homun with custom tools via MCP (Model Context Protocol) servers. An MCP server is an external process that exposes tools over a standardized protocol.

Common MCP servers:
- **Database**: query PostgreSQL, MySQL, or SQLite databases
- **GitHub**: manage repositories, issues, and pull requests
- **Slack**: send messages and manage channels
- **Google Drive**: read and write documents
- **Custom APIs**: wrap any REST API as MCP tools

Install from the Web UI under **MCP**, or via chat:
> "Install the Postgres MCP server"

Once connected, the MCP server's tools appear alongside built-in tools. The agent uses them just like any other tool.

## Tool Configuration

### Enabling and Disabling Tools

All tools are enabled by default. You can disable specific tools if you do not want Homun to use them:

```toml
[tools]
disabled = ["shell", "browser"]    # Disable specific tools
```

Disabled tools are not shown to the LLM and cannot be invoked.

### Tool Approval

Some actions require your confirmation before executing. This is controlled by the autonomy level:

- **Low autonomy**: Homun asks before most actions (file writes, shell commands, messages)
- **Medium autonomy**: Homun asks before destructive actions (file deletes, sending messages to others)
- **High autonomy**: Homun asks only before irreversible actions (sending emails, posting publicly)

Configure autonomy in settings or via the Web UI.

## Troubleshooting

### Tool Not Available

**Symptom**: Homun says it cannot perform an action, even though the tool exists.

**Check**:
1. The tool may be disabled in configuration
2. A skill may be restricting available tools (skills can limit tools via the `tools` field)
3. The MCP server providing the tool may not be connected

### Shell Command Fails

**Symptom**: commands fail with permission errors or "command not found".

**Check**:
1. The command may be blocked by the sandbox. Try disabling sandbox temporarily: `[sandbox] enabled = false`
2. The command may not be in the PATH inside the sandbox environment
3. On Docker sandbox, the container may not have the required tools installed

### Web Search Returns No Results

**Symptom**: web_search returns empty results or errors.

**Check**:
1. Verify your search API key is valid: `[search] api_key = "..."`
2. Check that the search provider is configured: `[search] provider = "brave"` or `"tavily"`
3. Some queries may trigger rate limits. Wait and try again.
