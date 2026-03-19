# Docker

The fastest way to get Homun running. Docker Compose handles the build, database, and networking for you.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) v2+

## Quick Start

1. **Clone the repository**

```bash
git clone https://github.com/homunbot/homunbot.git
cd homunbot
```

2. **Create your environment file**

```bash
cp .env.example .env
```

Edit `.env` with your preferred editor and set at least your LLM provider API key:

```env
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...
```

3. **Start Homun**

```bash
docker compose up -d
```

4. **Open the Web UI**

Navigate to [https://localhost](https://localhost) and complete the setup wizard. You will create your admin password and configure your first LLM provider.

## Local Embeddings with Ollama

If you want to run embeddings locally instead of using OpenAI, start Homun with the Ollama profile:

```bash
docker compose --profile with-ollama up -d
```

This starts an Ollama container alongside Homun. The setup wizard will detect it automatically.

## Environment Variables

All configuration can be set via environment variables in your `.env` file:

| Variable | Description | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude models | No* |
| `OPENAI_API_KEY` | OpenAI API key | No* |
| `HOMUN_PORT` | Web UI port (default: `18080`) | No |
| `HOMUN_DATA_DIR` | Data directory inside container | No |

*At least one LLM provider key is required.

## Updating

Pull the latest changes and rebuild:

```bash
git pull
docker compose up -d --build
```

Your data (database, config, memory) persists in a Docker volume and is not affected by updates.

## Stopping

```bash
docker compose down
```

To also remove the data volume (this deletes all data):

```bash
docker compose down -v
```
