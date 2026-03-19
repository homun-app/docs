# REST API Reference

Homun exposes 50+ REST API endpoints under `/api/v1/`.

## Authentication

All API endpoints require authentication via:
- **Session cookie** — set after login at `/api/v1/auth/login`
- **API key** — pass as `Authorization: Bearer <key>` header

## Base URL

```
https://your-homun-instance/api/v1/
```

## OpenAPI Specification

The full OpenAPI 3.0 specification is available in the repository:
[`openapi.yaml`](https://github.com/homunbot/homunbot/blob/main/docs/openapi.yaml)

## Core Endpoints

### Health
- `GET /api/health` — Health check (no auth required)

### Auth
- `POST /api/v1/auth/login` — Login with username/password
- `POST /api/v1/auth/logout` — Logout
- `GET /api/v1/auth/me` — Current user info

### Chat
- `GET /api/v1/sessions` — List chat sessions
- `POST /api/v1/sessions` — Create new session
- `GET /api/v1/sessions/:id/messages` — Get session messages
- `WebSocket /ws` — Real-time chat

### Skills
- `GET /api/v1/skills` — List installed skills
- `POST /api/v1/skills/install` — Install skill from GitHub
- `DELETE /api/v1/skills/:name` — Remove skill

### Knowledge
- `GET /api/v1/knowledge` — List knowledge documents
- `POST /api/v1/knowledge/ingest` — Ingest document
- `POST /api/v1/knowledge/search` — Search knowledge base

### Automations
- `GET /api/v1/automations` — List automations
- `POST /api/v1/automations` — Create automation
- `PUT /api/v1/automations/:id` — Update automation
- `DELETE /api/v1/automations/:id` — Delete automation

### Config
- `GET /api/v1/config/:path` — Get config value
- `PUT /api/v1/config/:path` — Set config value
