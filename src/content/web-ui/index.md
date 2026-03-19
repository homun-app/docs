# Web UI

Homun includes a full-featured web interface for managing your assistant, chatting, and configuring all aspects of the system.

## Accessing the Web UI

Start the gateway to enable the Web UI:

```bash
homun gateway
```

Then open your browser:

- **Local**: `https://localhost:18443`
- **Docker**: `https://your-domain` (via reverse proxy)

On first access, you will be guided through the [setup wizard](/web-ui/setup-wizard) to create your admin account and configure a LLM provider.

## Pages

The Web UI includes 20 pages organized in the sidebar:

| Page | Description |
|------|-------------|
| **Dashboard** | System overview, status, and quick actions |
| **Chat** | Conversational interface with streaming responses |
| **Channels** | Configure Telegram, Discord, Slack, WhatsApp, Email |
| **Automations** | Visual flow builder for automated tasks |
| **Workflows** | Multi-step workflow management |
| **Skills** | Install and manage agent skills |
| **MCP** | Manage Model Context Protocol servers |
| **Knowledge** | Upload and search documents (RAG) |
| **Memory** | Browse and edit agent memory |
| **Vault** | Manage encrypted secrets |
| **Browser** | Browser automation settings |
| **Approvals** | Review pending approval requests |
| **Logs** | Live log streaming and filtering |
| **Account** | User settings, API keys, 2FA |
| **Settings** | System configuration |

## Appearance

Customize the look of your Web UI:

- **Dark / Light mode** -- toggle in the sidebar
- **Accent color** -- choose from the accent picker in **Account > Appearance**

The UI uses the Olive Moss Console design system with consistent spacing, typography, and color tokens.

## Mobile Support

The Web UI is fully responsive and works on mobile devices. All pages adapt to smaller screens, with the sidebar collapsing into a hamburger menu on phones.
