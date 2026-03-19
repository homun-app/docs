# REST API

Homun exposes a REST API at `/api/v1/` for programmatic access to all features. The API uses JSON for request and response bodies, supports both session-based and token-based authentication, and includes real-time streaming via WebSocket and SSE endpoints.

## Base URL

All API endpoints are served under the base URL:

```
https://localhost:18443/api/v1/
```

Replace `localhost:18443` with your server address if accessing remotely.

## Authentication

Every API request (except `/api/v1/health`) must be authenticated using one of:

- **Session cookie** -- set automatically after web login (used by the Web UI)
- **Bearer token** -- API key with `wh_` prefix

```bash
# Using a bearer token
curl -H "Authorization: Bearer wh_your_token" \
  https://localhost:18443/api/v1/status
```

Create API keys from the Web UI under **Account > API Keys** or via the API itself. Each key has a scope (`admin`, `chat`, or `read`) that limits what it can access.

### Scope Permissions

| Scope | Can Read | Can Write | Can Admin |
|-------|:--------:|:---------:|:---------:|
| `read` | Yes | No | No |
| `chat` | Yes | Chat only | No |
| `admin` | Yes | Yes | Yes |

## CSRF Protection

State-changing requests (POST, PUT, PATCH, DELETE) from **web sessions** require a CSRF token. The token is provided in the `homun_csrf` cookie and must be sent in the `X-CSRF-Token` header.

```bash
# For session-based auth (web UI), include the CSRF token
curl -X POST https://localhost:18443/api/v1/chat \
  -H "Cookie: homun_session=..." \
  -H "X-CSRF-Token: csrf_token_value" \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'
```

**Bearer token authentication bypasses CSRF checks** since tokens are not vulnerable to CSRF attacks. This is the recommended approach for programmatic access.

## Rate Limiting

API calls are rate-limited per IP address. Limits can be customized in the [security configuration](/configuration/security).

| Category | Default | Header |
|----------|---------|--------|
| Authentication | 5 req/min | `X-RateLimit-Limit` |
| API calls | 60 req/min | `X-RateLimit-Limit` |

Rate limit headers are included in every response:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Max requests per window |
| `X-RateLimit-Remaining` | Requests remaining |
| `Retry-After` | Seconds to wait (429 responses only) |

## Error Format

All error responses use a consistent JSON format:

```json
{
  "error": "Description of what went wrong"
}
```

Common HTTP status codes:

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (invalid input) |
| 401 | Unauthorized (missing or invalid auth) |
| 403 | Forbidden (insufficient scope) |
| 404 | Not found |
| 429 | Rate limited |
| 500 | Internal server error |

## Endpoints by Domain

### System

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/health` | No | Health check, returns `{"status": "ok"}` |
| GET | `/api/v1/status` | read | System status: version, uptime, provider health, channel status |
| POST | `/api/v1/estop` | admin | Emergency stop -- halts all operations immediately |

**GET /api/v1/health**

No authentication required. Use this for monitoring and load balancer health checks.

```bash
curl https://localhost:18443/api/v1/health
```

```json
{"status": "ok"}
```

**GET /api/v1/status**

Returns detailed system information:

```bash
curl -H "Authorization: Bearer wh_token" \
  https://localhost:18443/api/v1/status
```

```json
{
  "version": "0.9.0",
  "uptime_secs": 3600,
  "agent_status": "running",
  "providers": {
    "default": "anthropic/claude-sonnet-4-5-20250514",
    "health": "healthy"
  },
  "channels": {
    "web": "running",
    "telegram": "running",
    "discord": "stopped"
  },
  "active_sessions": 3,
  "cron_jobs": 5
}
```

**POST /api/v1/estop**

Triggers emergency stop. See [Security > E-Stop](/configuration/security#emergency-stop-e-stop).

### Authentication

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/auth/login` | No | Log in with username and password |
| POST | `/api/auth/logout` | session | End the current session |
| GET | `/api/v1/account` | read | Get current user info |

**POST /api/auth/login**

```bash
curl -X POST https://localhost:18443/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'
```

On success, returns a `Set-Cookie` header with the session cookie. If 2FA is enabled, the response includes a `requires_2fa: true` field and you must call the login endpoint again with a `totp_code` field.

### Sessions

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/sessions` | read | List all chat sessions |
| POST | `/api/v1/sessions` | chat | Create a new chat session |
| GET | `/api/v1/sessions/:id` | read | Get session details |
| DELETE | `/api/v1/sessions/:id` | chat | Delete a session and its messages |
| GET | `/api/v1/sessions/:id/messages` | read | Get all messages in a session |

**GET /api/v1/sessions**

```bash
curl -H "Authorization: Bearer wh_token" \
  https://localhost:18443/api/v1/sessions
```

```json
{
  "sessions": [
    {
      "id": "sess_abc123",
      "title": "Help with Rust code",
      "created_at": "2025-01-15T10:30:00Z",
      "message_count": 12
    }
  ]
}
```

### Chat

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/v1/chat` | chat | Send a message and get a streamed response |
| POST | `/api/v1/chat/upload` | chat | Upload a file attachment for the next message |

**POST /api/v1/chat**

Send a message. The response is streamed as Server-Sent Events (SSE):

```bash
curl -N -H "Authorization: Bearer wh_token" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is Rust?", "session_id": "sess_abc123"}' \
  https://localhost:18443/api/v1/chat
```

SSE stream format:

```
data: {"type": "text", "content": "Rust is "}
data: {"type": "text", "content": "a systems "}
data: {"type": "text", "content": "programming language."}
data: {"type": "tool_use", "name": "web_search", "status": "running"}
data: {"type": "tool_result", "name": "web_search", "content": "..."}
data: {"type": "done"}
```

### Skills

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/skills` | read | List installed skills |
| POST | `/api/v1/skills/install` | admin | Install a skill from GitHub or ClawHub |
| DELETE | `/api/v1/skills/:name` | admin | Remove an installed skill |
| POST | `/api/v1/skills/search` | read | Search for skills |

**GET /api/v1/skills**

```bash
curl -H "Authorization: Bearer wh_token" \
  https://localhost:18443/api/v1/skills
```

```json
{
  "skills": [
    {
      "name": "weather",
      "description": "Check weather forecasts for any location",
      "source": "github:user/weather-skill",
      "version": "1.0.0"
    }
  ]
}
```

**POST /api/v1/skills/install**

```bash
curl -X POST -H "Authorization: Bearer wh_token" \
  -H "Content-Type: application/json" \
  -d '{"repo": "owner/skill-name"}' \
  https://localhost:18443/api/v1/skills/install
```

### Knowledge Base (RAG)

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/knowledge` | read | List ingested documents |
| POST | `/api/v1/knowledge/ingest` | admin | Ingest a document (multipart upload) |
| POST | `/api/v1/knowledge/search` | read | Semantic search the knowledge base |
| DELETE | `/api/v1/knowledge/:id` | admin | Remove an ingested document |

**POST /api/v1/knowledge/search**

```bash
curl -X POST -H "Authorization: Bearer wh_token" \
  -H "Content-Type: application/json" \
  -d '{"query": "deployment best practices", "limit": 5}' \
  https://localhost:18443/api/v1/knowledge/search
```

```json
{
  "results": [
    {
      "id": 42,
      "source": "deployment-guide.md",
      "chunk": "Always use rolling deployments...",
      "score": 0.89
    }
  ]
}
```

### Memory

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/memories` | read | List memories |
| POST | `/api/v1/memories/search` | read | Search memories by query |

**POST /api/v1/memories/search**

```bash
curl -X POST -H "Authorization: Bearer wh_token" \
  -H "Content-Type: application/json" \
  -d '{"query": "favorite programming language"}' \
  https://localhost:18443/api/v1/memories/search
```

### Automations

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/automations` | read | List all automations |
| POST | `/api/v1/automations` | admin | Create a new automation |
| GET | `/api/v1/automations/:id` | read | Get automation details |
| PUT | `/api/v1/automations/:id` | admin | Update an automation |
| DELETE | `/api/v1/automations/:id` | admin | Delete an automation |
| POST | `/api/v1/automations/:id/run` | admin | Run an automation immediately |
| POST | `/api/v1/automations/:id/toggle` | admin | Enable or disable an automation |
| GET | `/api/v1/automations/:id/history` | read | Get execution history |

**POST /api/v1/automations**

```bash
curl -X POST -H "Authorization: Bearer wh_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily News Summary",
    "prompt": "Search for today top tech news and summarize them",
    "cron": "0 9 * * *",
    "deliver_to": "telegram:123456"
  }' \
  https://localhost:18443/api/v1/automations
```

### Workflows

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/workflows` | read | List all workflows |
| POST | `/api/v1/workflows` | admin | Create a workflow |
| GET | `/api/v1/workflows/:id` | read | Get workflow details and status |
| DELETE | `/api/v1/workflows/:id` | admin | Delete a workflow |
| POST | `/api/v1/workflows/:id/approve` | admin | Approve a pending workflow step |
| POST | `/api/v1/workflows/:id/reject` | admin | Reject a pending workflow step |

### Configuration

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/config` | admin | Get current configuration (secrets masked) |
| PATCH | `/api/v1/config` | admin | Update configuration values |

**PATCH /api/v1/config**

```bash
curl -X PATCH -H "Authorization: Bearer wh_token" \
  -H "Content-Type: application/json" \
  -d '{"providers.default": "openai/gpt-4o"}' \
  https://localhost:18443/api/v1/config
```

### Vault

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/vault` | admin | List secret names (values not included) |
| GET | `/api/v1/vault/:key` | admin | Get a secret value |
| PUT | `/api/v1/vault/:key` | admin | Store or update a secret |
| DELETE | `/api/v1/vault/:key` | admin | Remove a secret |

**PUT /api/v1/vault/:key**

```bash
curl -X PUT -H "Authorization: Bearer wh_token" \
  -H "Content-Type: application/json" \
  -d '{"value": "sk-ant-api03-..."}' \
  https://localhost:18443/api/v1/vault/ANTHROPIC_API_KEY
```

### Account and API Keys

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/account` | read | Get current user info |
| GET | `/api/v1/account/api-keys` | admin | List API keys |
| POST | `/api/v1/account/api-keys` | admin | Create a new API key |
| DELETE | `/api/v1/account/api-keys/:id` | admin | Revoke an API key |
| POST | `/api/v1/account/2fa/enable` | admin | Start 2FA setup (returns QR code) |
| POST | `/api/v1/account/2fa/verify` | admin | Verify and activate 2FA |
| POST | `/api/v1/account/2fa/disable` | admin | Disable 2FA |

### Devices

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/devices` | admin | List trusted devices |
| POST | `/api/v1/devices/:id/approve` | admin | Approve a pending device |
| DELETE | `/api/v1/devices/:id` | admin | Revoke a trusted device |

### Channels

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/channels` | read | List channels and their status |
| GET | `/api/v1/channels/whatsapp/pair` | admin | WebSocket for WhatsApp QR pairing |

### Providers

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/providers` | read | List providers and health status |
| GET | `/api/v1/providers/models` | read | List available models |

### MCP Servers

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/mcp/servers` | read | List configured MCP servers |
| POST | `/api/v1/mcp/servers` | admin | Add an MCP server |
| DELETE | `/api/v1/mcp/servers/:name` | admin | Remove an MCP server |
| POST | `/api/v1/mcp/servers/:name/toggle` | admin | Enable or disable an MCP server |
| GET | `/api/v1/mcp/catalog` | read | List available MCP service presets |
| POST | `/api/v1/mcp/setup` | admin | Guided MCP server setup |
| GET | `/api/v1/mcp/oauth/callback` | No | OAuth callback for MCP service auth |

### Contacts

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/contacts` | read | List all contacts |
| POST | `/api/v1/contacts` | admin | Create a contact |
| PUT | `/api/v1/contacts/:id` | admin | Update a contact |
| DELETE | `/api/v1/contacts/:id` | admin | Delete a contact |

### Business Autopilot

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/business/dashboard` | read | Business dashboard data |
| GET | `/api/v1/business/transactions` | read | List transactions |

### Approvals

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/approvals` | read | List pending approvals |
| POST | `/api/v1/approvals/:id/approve` | admin | Approve a pending action |
| POST | `/api/v1/approvals/:id/reject` | admin | Reject a pending action |

### Logs

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/logs/stream` | admin | SSE stream of real-time logs |

**GET /api/v1/logs/stream**

Server-Sent Events stream of log entries:

```bash
curl -N -H "Authorization: Bearer wh_token" \
  https://localhost:18443/api/v1/logs/stream
```

```
data: {"timestamp": "2025-01-15T10:30:00Z", "level": "info", "message": "Agent loop started"}
data: {"timestamp": "2025-01-15T10:30:01Z", "level": "debug", "message": "Using model anthropic/claude-sonnet-4-5-20250514"}
```

### Maintenance

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/v1/maintenance/vacuum` | admin | Optimize the SQLite database |
| GET | `/api/v1/maintenance/stats` | admin | Database statistics |

### Usage

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/usage` | read | Usage statistics (requests, tokens, costs) |

### Sandbox

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| GET | `/api/v1/sandbox` | read | Sandbox configuration and backend info |
| PATCH | `/api/v1/sandbox` | admin | Update sandbox settings |

### Webhooks

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/v1/webhook/:token` | token | Ingest a message via webhook (no session auth) |

Webhook tokens are created per-user:

```bash
homun users token --user alice --name "zapier-webhook"
```

The response includes the full webhook URL with the token embedded.

### OpenAI-Compatible API

Homun exposes an OpenAI-compatible chat completions endpoint for interoperability with tools that expect the OpenAI API format:

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/v1/openai/chat/completions` | chat | OpenAI-compatible chat endpoint |

## WebSocket

The Web UI chat uses a WebSocket connection for real-time bidirectional communication:

```
wss://localhost:18443/ws
```

The WebSocket requires session authentication (the session cookie is sent during the upgrade handshake). Messages are JSON-encoded. The WebSocket handles:
- Sending user messages
- Receiving streamed LLM responses
- Tool use progress updates
- Session management

## Pagination

List endpoints that can return many items support pagination:

```bash
curl -H "Authorization: Bearer wh_token" \
  "https://localhost:18443/api/v1/sessions?limit=20&offset=0"
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `limit` | 50 | Maximum items per page |
| `offset` | 0 | Number of items to skip |
