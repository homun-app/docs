# Web UI

Homun includes a full-featured web interface for managing your assistant, chatting, configuring channels, building automations, and accessing every aspect of the system. The Web UI is built into the Homun binary -- no separate frontend server or build step is needed.

## Accessing the Web UI

Start the gateway to enable the Web UI:

```bash
homun gateway
```

Then open your browser:

- **Local**: `https://localhost:18443`
- **LAN**: `https://your-ip:18443` (accessible from other devices on your network)
- **Docker/VPS**: `https://your-domain` (via reverse proxy)

The Web UI always uses HTTPS with a self-signed certificate. Your browser will show a certificate warning on first access -- this is expected. Accept the certificate to proceed. For production deployments, place Homun behind a reverse proxy (nginx, Caddy) with a proper TLS certificate.

On first access, you will be guided through the [setup wizard](/web-ui/setup-wizard) to create your admin account and configure a LLM provider.

## Configuration

```toml
[web]
enabled = true
port = 18443
host = "0.0.0.0"
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | Boolean | `true` | Enable/disable the Web UI |
| `port` | Integer | `18443` | HTTPS port for the Web UI |
| `host` | String | `"0.0.0.0"` | Bind address. Use `127.0.0.1` to restrict to local access only. |

### Restricting Access

To allow only local connections (no network access):

```toml
[web]
host = "127.0.0.1"
```

To change the port:

```toml
[web]
port = 9443
```

### Authentication

The Web UI is protected by password authentication:
- Passwords are hashed with PBKDF2 (600,000 iterations)
- Session cookies are HMAC-signed and have configurable expiration
- Failed login attempts are rate-limited (5 per minute per IP)
- API endpoints require either a session cookie or an API bearer token

## Pages

The Web UI includes 20 pages organized in the sidebar. Each page provides a focused view of one aspect of Homun.

### Dashboard

The dashboard is the landing page after login. It provides a system overview at a glance:

- **System status**: gateway uptime, connected channels, active automations
- **Recent activity**: last messages, tool executions, and events
- **Quick actions**: start a chat, create an automation, check approvals
- **Usage analytics**: message counts, tool usage, and LLM token consumption over time

The dashboard refreshes automatically to show current status.

### Chat

The conversational interface for interacting with Homun. Features include real-time streaming responses, markdown rendering with syntax highlighting, tool execution timeline, multi-session support, and file uploads. See the [Chat](/web-ui/chat) page for full details.

### Channels

View and configure all messaging channels:

- **Status**: which channels are connected and active
- **Configuration**: API keys, tokens, and settings for each channel
- **Pairing**: WhatsApp QR code pairing, Telegram bot token entry, etc.
- **Health**: connection status, last message time, error counts

Supported channels: Telegram, Discord, Slack, WhatsApp, Email, Web (WebSocket), CLI.

Each channel shows a card with its current status (connected/disconnected), configuration fields, and a test button to verify the connection.

### Automations

The visual flow builder for creating automated tasks. This page combines:

- **Cron jobs**: listed with their schedules, last run, and next run time
- **Visual automations**: n8n-style canvas with drag-and-drop nodes
- **Execution history**: past runs with status, duration, and output

See [Automations & Workflows](/features/automations) for details on building automations.

### Workflows

Manage multi-step persistent workflows:

- **Active workflows**: workflows currently running or waiting for approval
- **Workflow builder**: create new workflows with steps and approval gates
- **History**: completed and failed workflows with full step-by-step logs
- **Manual actions**: retry failed steps, cancel running workflows, approve pending steps

### Skills

Skill management and marketplace:

- **Installed skills**: list of all skills with name, version, source, and status
- **Enable/Disable**: toggle skills on and off
- **Marketplace**: browse and install skills from ClawHub and OpenSkills
- **Details**: click a skill to see its full description, trigger, tools, and env requirements

See [Skills](/features/skills) for details on the skill system.

### MCP

Model Context Protocol server management:

- **Connected servers**: list of active MCP servers with their exposed tools
- **Discovery**: browse the MCP server registry
- **Install**: one-click install for MCP servers (configures connection automatically)
- **OAuth**: for MCP servers requiring OAuth authentication, the setup flow is handled in-browser
- **Tool list**: see all tools provided by each connected server

### Knowledge

RAG knowledge base management:

- **Documents**: list all ingested documents with chunk counts and sizes
- **Upload**: drag-and-drop or click to upload new documents
- **Search**: test the knowledge base search with a query
- **Delete**: remove documents and their associated chunks
- **Watch directories**: configure directories for auto-ingestion

See [Memory & Knowledge](/features/memory) for details on the RAG system.

### Memory

Browse and manage Homun's memory:

- **Search**: search memories by keyword or natural language
- **Browse**: scroll through memories sorted by date
- **Edit**: modify individual memory entries
- **Delete**: remove memories that are incorrect or outdated
- **User profile**: view and edit `USER.md` directly

### Vault

Encrypted secret management:

- **Secrets list**: all stored secret names (values are never shown in the UI)
- **Add/Update**: store new secrets or update existing ones
- **Delete**: remove secrets
- **2FA setup**: configure TOTP two-factor authentication

Secrets are encrypted with AES-256-GCM. The master key is stored in your OS keychain (macOS Keychain, Linux Secret Service, Windows Credential Manager).

### Browser

Browser automation settings and monitoring:

- **Configuration**: enable/disable browser, headless mode, browser type
- **Status**: whether the browser process is running
- **Active sessions**: current browser tabs and their URLs

See [Browser Automation](/features/browser) for details.

### Approvals

Review and act on pending approval requests:

- **Queue**: list of pending approvals with context
- **Details**: see what action is requesting approval and why
- **Actions**: approve or reject each request
- **History**: past approvals with timestamps and decisions

Approvals come from workflows, the approval tool, and actions that require user confirmation.

### Logs

Real-time log streaming and filtering:

- **Live stream**: logs appear in real-time via Server-Sent Events (SSE)
- **Level filter**: show all, info, warning, or error only
- **Text search**: filter logs by keyword
- **Source filter**: filter by component (agent, tools, channels, web, etc.)

Useful for debugging issues, monitoring agent behavior, and understanding what Homun is doing.

### Account

User settings and security:

- **Profile**: change username and password
- **API keys**: generate and manage API bearer tokens for programmatic access
- **2FA**: enable/disable TOTP two-factor authentication
- **Sessions**: view and revoke active sessions

API keys follow the format `wh_...` and can be used in the `Authorization: Bearer wh_...` header for API access.

### Settings

System configuration editor:

- **Provider settings**: LLM provider, model, API key
- **Channel settings**: configure each messaging channel
- **Feature toggles**: enable/disable browser, sandbox, heartbeat
- **Advanced**: all configuration options in a structured form

Changes made in Settings are written to `~/.homun/config.toml` and hot-reload where supported.

### Permissions

Access control and security settings:

- **Tool permissions**: configure which tools require approval
- **Autonomy level**: set how much Homun can do without asking
- **Channel permissions**: restrict which channels can trigger certain actions

### Business

Business automation dashboard (for the Business Autopilot feature):

- **OODA loop**: observe-orient-decide-act cycle for business tasks
- **Budget tracking**: monitor spending against configured budgets
- **Transaction history**: all business actions with costs
- **Autonomy levels**: configure how much the business autopilot can do independently

### Maintenance

System maintenance tools:

- **Database**: SQLite database size and optimization
- **Cache**: clear caches (embeddings, search index)
- **Updates**: check for Homun updates

### Login

The authentication screen. Appears when not logged in. Features:
- Username and password fields
- Rate limiting (5 attempts per minute)
- Redirect to setup wizard if no account exists

### Setup Wizard

First-time configuration flow. See [Setup Wizard](/web-ui/setup-wizard) for details.

## Design System

The Web UI uses the **Olive Moss Console** design system, inspired by Braun's design principles: clarity, order, and function over decoration.

### Key Design Principles

- **8px grid**: all spacing follows an 8px grid (8, 16, 24, 32, 48, 64px)
- **Semantic colors**: surfaces, text, and accents use CSS custom properties
- **Consistent typography**: a defined type scale for headings, body, and captions
- **Functional design**: every element serves a purpose, no decorative elements

### CSS Custom Properties

All colors, spacing, and typography use CSS custom properties (variables). This ensures consistency and makes theming possible:

- `var(--accent)` -- primary accent color
- `var(--surface-0)` through `var(--surface-3)` -- background layers
- `var(--text-0)` through `var(--text-2)` -- text hierarchy
- `var(--border)` -- borders and dividers
- `var(--success)`, `var(--warning)`, `var(--error)` -- status colors

## Appearance

### Theme

Toggle between dark and light mode:
- **Dark mode**: the default, optimized for extended use
- **Light mode**: brighter theme for well-lit environments
- **System**: follows your OS preference

The toggle is in the sidebar footer.

### Accent Color

Choose a custom accent color from the picker in **Account > Appearance**. The accent color is used for buttons, links, highlights, and active states throughout the UI.

Available accents span a range of hues. The selected accent automatically adjusts for contrast in both light and dark modes.

## Mobile Support

The Web UI is fully responsive and works on mobile devices (375px and up):

- **Sidebar**: collapses into a hamburger menu on small screens
- **Chat**: full-width message area with touch-friendly input
- **Forms**: input fields and buttons are sized for touch interaction
- **Tables**: horizontally scrollable on narrow screens
- **Canvas**: the automations visual builder adapts to smaller viewports

All features work on mobile. The layout adjusts at breakpoints: 390px, 768px, 1024px, and 1280px.

## API Access

Every action available in the Web UI is also available via the REST API. All API endpoints are under `/api/v1/`:

```bash
# Authentication
curl -X POST https://localhost:18443/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'

# Or use an API key
curl https://localhost:18443/api/v1/sessions \
  -H "Authorization: Bearer wh_your_api_key"
```

The API returns JSON responses and follows REST conventions. See the API documentation for the full endpoint list.

## Component States

Every component in the Web UI handles four states:

| State | What the user sees |
|-------|-------------------|
| **Empty** | A helpful message explaining what this feature does and how to get started |
| **Loading** | A spinner or skeleton placeholder |
| **Error** | An error message with context and suggested fix |
| **Success** | The expected content or a confirmation message |

This ensures the UI is always informative, even when things go wrong or when a feature has not been used yet.

## Troubleshooting

### Cannot Access Web UI

**Symptom**: browser shows "connection refused" or timeout.

**Check**:
1. Verify the gateway is running: `homun gateway`
2. Check the port in config (default 18443)
3. If `host = "127.0.0.1"`, the UI is only accessible from localhost
4. Check firewall rules if accessing from another device

### Certificate Warning

**Symptom**: browser shows "Your connection is not private" or similar.

**Explanation**: Homun uses a self-signed TLS certificate. This is secure for local use but browsers warn because it is not signed by a trusted CA.

**Fix**: accept the certificate in your browser. For production, use a reverse proxy with a proper certificate.

### Slow Loading

**Symptom**: pages take a long time to load.

**Check**:
1. In debug mode, static assets are served from disk (fast reloads but no compression)
2. In release mode, assets are embedded in the binary and served with compression
3. Check network latency if accessing over the internet
