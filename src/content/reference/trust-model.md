# Trust Model

Homun operates with a layered trust model that defines who can interact with the system, how they authenticate, and what they can access.

## Principals

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

## Trust Boundaries

Homun separates content into three trust zones:

### Trusted Zone

The agent loop, tools, memory, vault, and configuration. These run as a local process with full OS access. Only your actions and configuration control what happens here.

### Authenticated Zone

Web sessions, API tokens, and paired channel senders. Identity is verified, and permissions are scoped. Authenticated users can interact with Homun through defined interfaces.

### Untrusted Zone

Webhook payloads, browser page content, MCP tool results, and messages from unknown senders. All content from this zone is:

- Labeled as untrusted in the agent's context
- Scanned for injection attempts
- Never executed as commands without verification

## Content Trust Levels

| Source | Trust Level | How It Is Handled |
|--------|------------|-------------------|
| Config files | Full | Used directly |
| Messages from paired users | High | Processed by the agent |
| Messages from unknown senders | Low | Pairing challenge required first |
| Tool execution results | Medium | Scanned for injection patterns |
| Webhook payloads | Low | Framed as untrusted content |
| Browser page content | Low | Labeled as untrusted |
| MCP service responses | Medium | Sandboxed by protocol |
| RAG documents | Medium | Sensitive data vault-gated |

## Approval System

For sensitive actions, Homun pauses and asks for your explicit confirmation before proceeding. This applies to actions like:

- Running destructive shell commands
- Sending messages on your behalf
- Making external API calls with your credentials
- Modifying system configuration

You can configure the autonomy level to control how much Homun can do independently versus what requires approval.

## Sandbox Isolation

Shell commands run inside a [sandbox](/features/sandbox) by default, limiting filesystem and network access. This prevents accidental or malicious commands from affecting your system.

## Security Controls

| Control | Default |
|---------|---------|
| Auth rate limiting | 5 attempts/min per IP |
| API rate limiting | 60 requests/min per IP |
| CSRF protection | Enabled on all state-changing requests |
| Session binding | Enabled (warns on IP/UA drift) |
| Device approval | Disabled (enable for remote access) |
| Injection scanning | Enabled (7 detection patterns) |
| Vault encryption | AES-256-GCM with OS keychain |
| Emergency stop | Available via Web UI and API |
