# Web UI

The Web UI is Homun's built-in browser interface. It runs as part of the gateway process — no extra installation, no separate server. When the gateway starts, the Web UI is automatically available at `https://localhost:18443`.

The Web UI serves as both a messaging channel (chat via WebSocket) and a management dashboard for all aspects of Homun.

## Quick Setup

1. Start the gateway:

```bash
homun gateway
```

2. Open your browser to: **https://localhost:18443**
3. On first access, you are asked to create an admin password
4. Log in and start chatting

No additional configuration is required. The Web UI works out of the box.

## How It Works

The Web UI is an Axum HTTP server with embedded static assets (CSS, JavaScript). All assets are compiled into the binary using `rust-embed`, so there are no external file dependencies.

The chat interface uses a **WebSocket** connection for real-time, bidirectional communication:

```
Browser <-- WebSocket --> Axum server <-- MessageBus --> AgentLoop
```

When you type a message in the chat:

1. The message is sent over the WebSocket to the Axum server
2. The server creates an `InboundMessage` and sends it to the message bus
3. The agent processes the message (reasoning, tool calls, response generation)
4. The response streams back through the WebSocket in real-time
5. The browser renders the response as it arrives (token by token)

## Configuration Reference

```toml
[web]
# Enable the web server (default: true)
enabled = true

# Host to bind to (default: "127.0.0.1")
# Use "0.0.0.0" to accept connections from all interfaces
host = "127.0.0.1"

# Port for the web server (default: 18443)
port = 18443

# Custom domain for the web UI (default: "localhost")
# Used in self-signed cert SANs and CORS origin matching
domain = "localhost"

# Optional auth token for remote access
# Empty = no token auth (password-only)
auth_token = ""

# API rate limit: max requests per minute per IP (default: 60)
rate_limit_per_minute = 60

# Auth rate limit: max login attempts per minute per IP (default: 5)
auth_rate_limit_per_minute = 5

# Path to TLS certificate PEM file (optional)
# Empty = use auto-generated self-signed certificate
tls_cert = ""

# Path to TLS private key PEM file (optional)
# Empty = use auto-generated self-signed certificate
tls_key = ""

# Auto-generate self-signed cert if no cert/key provided (default: true)
auto_tls = true

# Trust X-Forwarded-For header for client IP extraction (default: false)
# Only enable when running behind a trusted reverse proxy
trust_x_forwarded_for = false

# Session lifetime in seconds (default: 86400 = 24 hours)
session_ttl_secs = 86400

# Require explicit device approval for new browsers (default: false)
# When enabled, login from an unrecognized User-Agent requires a 6-digit code
require_device_approval = false
```

### Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | Boolean | `true` | Enable the web server |
| `host` | String | `"127.0.0.1"` | Bind address. `0.0.0.0` for all interfaces |
| `port` | Integer | `18443` | Server port |
| `domain` | String | `"localhost"` | Domain for TLS certs and CORS |
| `auth_token` | String | `""` | Optional API auth token |
| `rate_limit_per_minute` | Integer | `60` | API rate limit per IP |
| `auth_rate_limit_per_minute` | Integer | `5` | Login rate limit per IP |
| `tls_cert` | String | `""` | Path to TLS certificate PEM |
| `tls_key` | String | `""` | Path to TLS private key PEM |
| `auto_tls` | Boolean | `true` | Auto-generate self-signed TLS cert |
| `trust_x_forwarded_for` | Boolean | `false` | Trust proxy X-Forwarded-For header |
| `session_ttl_secs` | Integer | `86400` | Session duration (24 hours) |
| `require_device_approval` | Boolean | `false` | Require 6-digit code for new browsers |

## Accessing the Web UI

### Local Access

By default, the Web UI is bound to `127.0.0.1` (localhost only). Access it at:

- **HTTPS (default)**: `https://localhost:18443`
- **Custom port**: `https://localhost:{port}` if you changed the port

On first access, your browser may show a security warning because of the self-signed TLS certificate. This is expected. Accept the warning to proceed.

### Remote Access

To access the Web UI from other devices on your network:

1. Change the bind address to all interfaces:

```toml
[web]
host = "0.0.0.0"
```

2. Access from other devices using your machine's IP: `https://192.168.1.100:18443`

For production remote access, consider:

- Using a reverse proxy (nginx, Caddy, Tailscale) with proper TLS certificates
- Setting `trust_x_forwarded_for = true` when behind a reverse proxy
- Setting `domain` to your actual domain for correct CORS and TLS SANs

### Custom TLS Certificates

To use your own TLS certificates instead of the auto-generated self-signed ones:

```toml
[web]
tls_cert = "/path/to/fullchain.pem"
tls_key = "/path/to/privkey.pem"
auto_tls = false
```

This eliminates the browser security warning. You can obtain certificates from Let's Encrypt, your domain registrar, or your organization's CA.

## Authentication

### Password Setup

On first access, the Web UI prompts you to create an admin password. This password is hashed with **PBKDF2** (600,000 iterations) and stored in the database. The original password is never stored.

### Login

After setting up the password, all subsequent visits require authentication. The login process:

1. Enter your password
2. The server verifies it against the PBKDF2 hash
3. On success, an **HMAC-signed session cookie** is created
4. The session lasts for `session_ttl_secs` (default: 24 hours)

### Rate Limiting

Login attempts are rate-limited to **5 per minute per IP address**. After exceeding the limit, further attempts are blocked until the rate window resets. This protects against brute-force password attacks.

API endpoints are rate-limited to **60 requests per minute per IP** by default.

### Device Approval

When `require_device_approval = true`, logging in from a new browser (unrecognized User-Agent) requires a 6-digit code. The code appears in the gateway logs. This adds a second layer of security for remote access.

### API Keys

The Web UI supports API key authentication for programmatic access. API keys can be managed from the Account page. Use the `Authorization: Bearer <api-key>` header for API calls.

## Features

### Real-Time Chat

The chat interface supports:

- **Streaming responses**: text appears token by token as the agent generates it, with no waiting for the full response
- **Markdown rendering**: headings, bold, italic, code blocks with syntax highlighting, lists, tables, links
- **Tool timeline**: expandable section showing which tools the agent called, their parameters, and results
- **File upload**: drag and drop or click to attach images, documents, and other files to your message
- **Session persistence**: conversations are stored in the database and survive gateway restarts

### Multi-Session Support

You can create and switch between multiple chat sessions from the sidebar:

- Click the **New Session** button to start a fresh conversation
- Previous sessions are listed in the sidebar with their most recent message
- Switch between sessions without losing context
- Each session has its own conversation history

### Management Pages

Beyond chat, the Web UI provides pages for managing all aspects of Homun:

| Page | Purpose |
|---|---|
| **Dashboard** | System status, usage analytics, and operational metrics |
| **Chat** | Real-time AI chat with streaming and tool timeline |
| **Channels** | Configure and pair messaging channels (WhatsApp QR code, etc.) |
| **Skills** | Browse, install, and manage agent skills |
| **MCP** | Discover and connect MCP servers |
| **Knowledge** | Upload documents to the RAG knowledge base, search indexed content |
| **Memory** | View and search the agent's long-term memory |
| **Automations** | Build visual automation flows (n8n-style canvas) |
| **Workflows** | Create and monitor multi-step workflows with approval gates |
| **Business** | Business dashboard with OODA loop metrics |
| **Vault** | Manage encrypted secrets and 2FA settings |
| **Approvals** | Review and approve pending agent actions |
| **Account** | User settings, API tokens, appearance customization |
| **Logs** | Real-time log streaming with level filtering |
| **Settings** | Configure LLM providers, models, and system settings |

### Mobile Responsiveness

The Web UI is designed mobile-first and works on all screen sizes:

- **Phone** (375px+): single-column layout, collapsible sidebar
- **Tablet** (768px+): sidebar visible, wider content area
- **Desktop** (1024px+): full layout with sidebar, content, and panels

### Theme and Appearance

The Web UI uses the "Olive Moss Console" design system with:

- **Light and dark mode**: automatic detection of system preference, or manual toggle
- **Accent color picker**: choose from predefined accent colors or set a custom one
- **Consistent design tokens**: all colors, spacing, and typography use CSS variables

Appearance settings are available in the Account page.

## REST API

The Web UI exposes **50+ REST API endpoints** under `/api/v1/`. These can be used for programmatic access, scripting, or building custom integrations:

- `POST /api/v1/chat` — send a message (non-streaming)
- `GET /api/v1/sessions` — list chat sessions
- `GET /api/v1/health` — health check
- `GET /api/v1/skills` — list installed skills
- `GET /api/v1/memory/search?q=...` — search memory
- `GET /api/v1/knowledge/search?q=...` — search knowledge base

All API endpoints require authentication (session cookie or API key), except `/api/v1/health`.

## Troubleshooting

### Browser shows "Connection Refused"

1. Verify the gateway is running: `homun gateway`
2. Check the port: default is `18443`, not `18080`
3. Check the bind address: default is `127.0.0.1` (localhost only)
4. Make sure you are using `https://` not `http://`

### Browser shows TLS certificate warning

This is expected with the default self-signed certificate. Click "Advanced" and proceed. To eliminate the warning, configure custom TLS certificates or use a reverse proxy with proper certificates.

### "Too many login attempts"

The rate limiter has blocked your IP. Wait one minute and try again. If you have forgotten your password, you can reset it by deleting the user record from the SQLite database:

```bash
sqlite3 ~/.homun/homun.db "DELETE FROM users;"
```

Then restart the gateway and set a new password.

### Chat messages not streaming

1. Check the browser console for WebSocket errors
2. Verify the WebSocket connection is established (network tab in browser dev tools)
3. Check for reverse proxy configuration issues (WebSocket upgrade must be forwarded)

### Page loads but shows no data

Check that the API endpoints are accessible. Open the browser console (F12) and look for 401 (authentication) or 500 (server error) responses. If you see 401 errors, your session may have expired — log in again.

## Tips and Best Practices

- **Bookmark `https://localhost:18443`** for quick access.
- **Use the Web UI for file uploads** — it is the best way to share documents and images with the agent.
- **Check the Dashboard** periodically for system health, usage analytics, and error counts.
- **Use API keys** for scripting and automation instead of session cookies.
- **Set up proper TLS** if accessing the Web UI remotely. Self-signed certificates are fine for localhost but not suitable for production remote access.
