# REST API

Homun exposes a REST API at `/api/v1/` for programmatic access to all features.

## Authentication

Every API request must be authenticated using one of:

- **Session cookie** -- set after web login (used by the Web UI)
- **Bearer token** -- API key with `wh_` prefix

```bash
# Using a bearer token
curl -H "Authorization: Bearer wh_your_token" \
  https://localhost:18443/api/v1/health
```

Create API keys from the Web UI under **Account > API Keys**. Each key has a scope (`admin`, `chat`, or `read`) that limits what it can access.

## Endpoints

### System

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check (no auth required) |
| GET | `/api/v1/status` | System status and version |
| POST | `/api/v1/estop` | Emergency stop all operations |

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Log in with username/password |
| POST | `/api/auth/logout` | End session |
| GET | `/api/v1/account` | Current user info |

### Chat

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/sessions` | List chat sessions |
| POST | `/api/v1/sessions` | Create a new session |
| DELETE | `/api/v1/sessions/:id` | Delete a session |
| GET | `/api/v1/sessions/:id/messages` | Get messages in a session |
| POST | `/api/v1/chat` | Send a message (returns streamed response) |

### Skills

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/skills` | List installed skills |
| POST | `/api/v1/skills/install` | Install a skill from GitHub |
| DELETE | `/api/v1/skills/:name` | Remove a skill |

### Knowledge

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/knowledge` | List ingested documents |
| POST | `/api/v1/knowledge/ingest` | Ingest a document |
| POST | `/api/v1/knowledge/search` | Search the knowledge base |

### Memory

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/memories` | List memories |
| POST | `/api/v1/memories/search` | Search memories |

### Automations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/automations` | List automations |
| POST | `/api/v1/automations` | Create an automation |
| PUT | `/api/v1/automations/:id` | Update an automation |
| DELETE | `/api/v1/automations/:id` | Delete an automation |

### Configuration

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/config` | Get current configuration |
| PATCH | `/api/v1/config` | Update configuration |

### Devices

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/devices` | List trusted devices |
| POST | `/api/v1/devices/:id/approve` | Approve a device |
| DELETE | `/api/v1/devices/:id` | Revoke a device |

### Vault

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/vault` | List secret names |
| GET | `/api/v1/vault/:key` | Get a secret value |
| PUT | `/api/v1/vault/:key` | Store a secret |
| DELETE | `/api/v1/vault/:key` | Remove a secret |

## Rate Limits

API calls are rate-limited to 60 requests per minute per IP address. Authentication endpoints are limited to 5 requests per minute per IP. These limits can be customized in the [security configuration](/configuration/security).

## CSRF Protection

State-changing requests (POST, PUT, PATCH, DELETE) from web sessions require a CSRF token. The token is provided in the `homun_csrf` cookie and must be sent in the `X-CSRF-Token` header. Bearer token authentication bypasses CSRF checks.
