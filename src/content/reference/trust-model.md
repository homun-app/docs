# Trust Model

Homun operates with a layered trust model that defines who can interact with the system, how they authenticate, what they can access, and how data flows through the system. This page documents every security boundary, isolation mechanism, and data flow decision.

## Design Principles

Homun's security model follows three core principles:

1. **Local-first**: Your data stays on your machine unless you explicitly configure an LLM provider or external service. There is no cloud account, no telemetry, no phoning home.
2. **Defense in depth**: Multiple independent security layers mean that a failure in one layer does not compromise the whole system.
3. **Fail closed**: When in doubt, Homun denies access. Unknown senders are blocked. Unrecognized devices require approval. Missing permissions reject the request.

## Principals

Every entity that interacts with Homun has a defined role with specific capabilities:

| Principal | Authentication | What They Can Do |
|-----------|---------------|-----------------|
| **Local admin** | Web login (password) | Full control over everything |
| **Remote admin** | Web login + device approval | Same as local, with session binding |
| **API client** | Bearer token (`wh_*`) | Scoped: admin, chat, or read-only |
| **Channel sender** | Channel identity (Telegram ID, etc.) | Send messages, trigger agent |
| **Webhook caller** | Bearer token | Inject messages (treated as untrusted) |
| **MCP service** | OAuth or API key | Execute tools via MCP protocol |
| **Agent** | Internal | Use tools, memory, send messages |
| **Cron job** | Internal | Trigger agent on schedule |
| **Skill** | Internal (sandboxed) | Execute scripts with injected env variables |

### Principal Hierarchy

Permissions are not inherited. Each principal type has its own independent set of capabilities. An API key with `chat` scope cannot perform `admin` actions even if the user who created the key is an admin. The scope is locked at key creation time.

## Trust Boundaries

Homun separates content into three trust zones. Each zone has different rules for how content is handled.

### Trusted Zone

The agent loop, tools, memory, vault, and configuration. These run as a local process with full OS access. Only your actions and configuration control what happens here.

What lives in the trusted zone:
- Configuration files (`config.toml`, brain files)
- The vault and its master key
- The SQLite database
- The agent loop and tool execution engine
- Memory consolidation logic
- Cron and automation scheduler

### Authenticated Zone

Web sessions, API tokens, and paired channel senders. Identity is verified, and permissions are scoped. Authenticated users can interact with Homun through defined interfaces but cannot bypass the security controls.

What lives in the authenticated zone:
- Web UI sessions (password + optional 2FA)
- API key requests (scoped by role)
- Paired channel users (verified via OTP)
- Webhook callers (token-authenticated)

### Untrusted Zone

Webhook payloads, browser page content, MCP tool results, and messages from unknown senders. All content from this zone is:

- Labeled as untrusted in the agent's context
- Scanned for injection attempts
- Never executed as commands without verification
- Subject to exfiltration guard scanning

What lives in the untrusted zone:
- Messages from unknown (unpaired) senders
- Web page content fetched by the browser tool
- MCP service responses
- Webhook payloads from external systems
- Email content from unknown senders
- RAG document content (sensitive data vault-gated)

## Content Trust Levels

Every piece of content that enters the agent loop has a trust level that determines how it is handled:

| Source | Trust Level | How It Is Handled |
|--------|------------|-------------------|
| Config files | Full | Used directly, no scanning |
| Brain files (USER.md, SOUL.md) | Full | Injected directly into system prompt |
| Messages from paired users | High | Processed by the agent normally |
| Messages from unknown senders | Low | Pairing challenge required before processing |
| Tool execution results | Medium | Scanned by exfiltration guard |
| Webhook payloads | Low | Framed as untrusted content in agent context |
| Browser page content | Low | Labeled as untrusted, injection-scanned |
| MCP service responses | Medium | Sandboxed by protocol, scanned |
| RAG documents | Medium | Sensitive data classified and vault-gated |
| Email content | Low | Scanned for injection, sender verified |

## Approval System

For sensitive actions, Homun pauses and asks for your explicit confirmation before proceeding. This prevents the agent from taking destructive or irreversible actions without your knowledge.

### Actions That Require Approval

- Running destructive shell commands (e.g., `rm -rf`, `DROP TABLE`)
- Sending messages on your behalf to external services
- Making external API calls with your credentials
- Modifying system configuration
- Installing new skills
- Financial transactions (in business autopilot)

### Approval Flow

1. The agent determines an action requires approval
2. The action is queued in the approval system
3. You receive a notification (Web UI, configured channel, or CLI)
4. You review the action details and approve or reject
5. If approved, the action executes; if rejected, the agent is informed

### Approval Timeout

Pending approvals expire after a configurable timeout (default: 24 hours). Expired approvals are treated as rejected. The agent is notified and can suggest an alternative approach.

### Approval Channels

Approval requests are delivered through:
- **Web UI**: The Approvals page shows all pending items
- **Messaging channels**: Sent to your configured primary channel (Telegram, Discord, etc.)
- **API**: Queryable via `GET /api/v1/approvals`

## Sandbox Isolation

Shell commands executed by the agent run inside a sandbox by default. The sandbox limits filesystem access, network access, and execution time to prevent accidental or malicious damage.

### What Runs in the Sandbox

| Component | Sandboxed | Why |
|-----------|:---------:|-----|
| Shell commands (tool) | Yes | Prevents filesystem/network abuse |
| Skill scripts | Yes | Untrusted code from external repos |
| Browser automation | Partially | Browser runs in separate process; Playwright MCP isolates |
| MCP tool calls | No | Delegated to MCP server process |
| Agent loop | No | Core process, needs full access |
| Cron jobs | Yes | Agent runs inside sandbox for tool calls |

### Sandbox Backends

Homun auto-detects the best available sandbox backend:

| Backend | Platform | Isolation Level |
|---------|----------|:---------------:|
| Docker | Any | High (container) |
| Native/macOS | macOS | Medium (sandbox-exec) |
| Bubblewrap | Linux | Medium (namespace isolation) |
| Windows Job Objects | Windows | Medium (resource limits) |

### What the Sandbox Restricts

- **Filesystem**: Read-only access to most paths; write access only to a temporary directory
- **Network**: Blocked by default (configurable)
- **Execution time**: Timeout after 30 seconds (configurable)
- **Process limits**: Cannot fork-bomb or exhaust system resources

## Data Flow

Understanding where your data goes is critical for privacy. Here is every data path in Homun:

### Data That Leaves Your Machine

| Data | Destination | When | Configurable |
|------|-------------|------|:------------:|
| Conversation messages | LLM provider API | Every chat interaction | Yes (provider choice) |
| Tool call results | LLM provider API | When agent uses tools | Yes |
| System prompt | LLM provider API | Every chat interaction | Yes |
| Search queries | Brave/Tavily API | When agent uses web search | Yes |
| Skill installs | GitHub API | When installing skills | Yes |
| ClawHub queries | ClawHub API | When browsing marketplace | Yes |

### Data That Stays on Your Machine

| Data | Location | Purpose |
|------|----------|---------|
| Configuration | `~/.homun/config.toml` | All settings |
| Conversations | `~/.homun/homun.db` | Chat history |
| Memories | `~/.homun/homun.db` + `memory/*.md` | Long-term memory |
| Brain files | `~/.homun/brain/` | User profile, personality |
| Vault secrets | `~/.homun/secrets.enc` | Encrypted secrets |
| Knowledge base | `~/.homun/homun.db` | RAG embeddings and chunks |
| Installed skills | `~/.homun/skills/` | Skill files and scripts |
| Logs | `~/.homun/logs/` | Application logs |

### Using Ollama (Zero Data Leakage)

When using Ollama as your LLM provider, **no data leaves your machine at all**. The LLM runs locally, and all processing happens on your hardware. This is the maximum privacy configuration:

```toml
[providers]
default = "ollama/llama3"

[providers.ollama]
base_url = "http://localhost:11434"
```

With this configuration and no web search tools configured, Homun operates entirely offline.

## Vault Protection

The vault isolates secrets from the LLM and from accidental exposure:

### Vault-to-LLM Barrier

Vault secrets are **never** included in the system prompt or conversation context. When a skill or automation needs a secret:

1. The secret name is referenced (e.g., `WEATHER_API_KEY`)
2. Homun looks up the name in the vault at execution time
3. The decrypted value is injected into the skill's environment variables
4. The LLM only sees the secret name, never the value
5. After execution, the value is zeroized from memory

### Vault Leak Detection

Even with the above barrier, there are edge cases where secrets might appear in tool results (e.g., a shell command that prints environment variables). The vault leak detector catches these:

1. Before any tool result is sent to the LLM, it is scanned
2. If any vault secret value is found in the text, it is replaced with `[REDACTED:secret_name]`
3. A warning is logged (at `warn` level)

This is a defense-in-depth measure. The primary protection is that secrets are never exposed to the LLM context in the first place.

## Exfiltration Guard

The exfiltration guard is a broader security layer that detects sensitive data patterns in all outbound content, not just vault secrets. It catches:

- API keys (various provider formats)
- Bearer and OAuth tokens
- JWT tokens
- Password patterns
- PEM-encoded private keys
- SSH private keys
- Database connection strings with credentials
- AWS access keys and secret keys
- High-entropy strings that look like secrets

The guard runs on all tool results before they reach the LLM. Detected patterns are replaced with `[REDACTED]` and a warning is logged. The guard is always enabled and cannot be disabled.

## Network Access

### Outbound Connections Homun Makes

| Service | When | Required |
|---------|------|:--------:|
| LLM provider API | Every chat | Yes |
| Brave/Tavily Search API | Web search tool | Optional |
| GitHub API | Skill install | Optional |
| Ollama (localhost) | Local LLM | Optional |
| MCP servers | MCP tool use | Optional |
| IMAP/SMTP servers | Email channel | Optional |
| Telegram/Discord/Slack APIs | Channel messages | Optional |
| Web pages | Browser tool, web fetch | Optional |

### Inbound Connections Homun Accepts

| Port | Service | Default Binding |
|------|---------|:---------------:|
| 18443 | Web UI (HTTPS) | `127.0.0.1` (localhost only) |
| No other ports | -- | -- |

Homun only listens on one port. All messaging channels use outbound connections (long polling, WebSocket to the platform's servers). There are no additional inbound ports.

## File System Access

### What Homun Reads

| Path | Purpose | Access |
|------|---------|--------|
| `~/.homun/` | Data directory | Read/Write |
| Working directory | Skill scripts | Read |
| `knowledge.watch_dirs` | Auto-ingest documents | Read |
| Any path via `file` tool | Agent reads files you ask about | Read (sandboxed) |

### What Homun Writes

| Path | Purpose |
|------|---------|
| `~/.homun/config.toml` | Configuration changes |
| `~/.homun/homun.db` | Database (sessions, memories, etc.) |
| `~/.homun/secrets.enc` | Vault updates |
| `~/.homun/brain/*.md` | Memory updates (via remember tool) |
| `~/.homun/memory/*.md` | Daily memory files |
| `~/.homun/tls/` | Auto-generated TLS certificates |
| `~/.homun/logs/` | Log files |
| `~/.homun/skills/` | Installed skills |

The agent can also write files via the `file` tool, but only to paths the user explicitly requests. File writes through tools are logged.

## Browser Isolation

Browser automation runs through a separate MCP Playwright process:

- The browser process is a child of the `npx @playwright/mcp` command, not part of the Homun binary
- Each browser session has its own user data directory
- Stealth injection prevents basic bot detection but does not bypass sophisticated anti-bot systems
- Browser page content is treated as untrusted (low trust level)
- The exfiltration guard scans all content extracted from web pages

Browser sessions are destroyed on E-Stop and can be closed individually.

## Comparison with Other AI Assistants

| Feature | Homun | Cloud AI Assistants | ChatGPT/Claude Web |
|---------|:-----:|:-------------------:|:------------------:|
| Data stored locally | Yes | No | No |
| Choose your LLM | Yes | No | No |
| Fully offline option | Yes (Ollama) | No | No |
| Open source | Yes | Varies | No |
| Encrypted vault | Yes | Varies | No |
| Self-hosted | Yes | Sometimes | No |
| No telemetry | Yes | Varies | No |
| Tool use sandboxed | Yes | Varies | Varies |
| Emergency stop | Yes | No | No |

## Security Controls Summary

| Control | Default | Configurable |
|---------|:-------:|:------------:|
| Auth rate limiting | 5 attempts/min per IP | Yes |
| API rate limiting | 60 requests/min per IP | Yes |
| CSRF protection | Enabled on all state-changing requests | No (always on) |
| Session binding | Enabled (warns on IP/UA drift) | No (always on) |
| Device approval | Disabled | Yes |
| Injection scanning | Enabled (7 detection patterns) | No (always on) |
| Vault encryption | AES-256-GCM with OS keychain | No (always on) |
| Vault leak detection | Enabled | No (always on) |
| Exfiltration guard | Enabled | No (always on) |
| Emergency stop | Available | N/A |
| Sandbox | Enabled (auto backend) | Yes (backend, timeout) |
| 2FA | Disabled | Yes |
| HTTPS | Self-signed cert | Yes (reverse proxy) |
