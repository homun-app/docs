# Web UI

The Web UI is Homun's built-in browser interface. It is always available when the gateway is running -- no extra setup needed.

## Access

Start the gateway:

```bash
homun gateway
```

Then open your browser to:

- **Local**: [http://localhost:18080](http://localhost:18080)
- **With TLS**: [https://localhost](https://localhost) (if TLS is configured)

On first access, you will be asked to create an admin password.

## Features

- **Real-time chat** via WebSocket with streaming responses
- **Multi-session** support -- create and switch between conversations
- **Markdown rendering** with syntax-highlighted code blocks
- **Tool timeline** -- see which tools the agent called and their results
- **File upload** -- attach images, documents, and other files to messages
- **Mobile-friendly** responsive layout

## Configuration

The Web UI runs on the gateway's HTTP server. You can customize it in `~/.homun/config.toml`:

```toml
[web]
# Port for the web server (default: 18080)
port = 18080

# Enable HTTPS with TLS certificates (optional)
tls_cert = "/path/to/cert.pem"
tls_key = "/path/to/key.pem"
```

## Authentication

The Web UI uses password authentication with:

- PBKDF2 password hashing (600k iterations)
- HMAC-signed session cookies
- Rate limiting (5 login attempts per minute per IP)

## Beyond Chat

The Web UI also provides pages for managing all aspects of Homun:

- **Dashboard** -- system status and usage analytics
- **Channels** -- configure and pair messaging channels
- **Skills** -- browse, install, and manage agent skills
- **Knowledge** -- upload documents to the RAG knowledge base
- **Memory** -- view and search the agent's long-term memory
- **Automations** -- build visual automation flows
- **Vault** -- manage encrypted secrets
- **Settings** -- configure LLM providers, appearance, and more
