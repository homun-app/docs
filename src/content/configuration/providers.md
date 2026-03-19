# LLM Providers

Homun supports 6 LLM providers and 14+ models out of the box. You configure a default model, optional fallback chain, and per-provider API keys. Homun automatically routes requests to the correct provider based on the model prefix, detects each model's capabilities, and handles failures with circuit breakers and retry logic.

## How Model Routing Works

The model string format is `provider/model-name`. Homun reads the prefix before the `/` and routes to the matching provider:

| Prefix | Provider | Protocol |
|--------|----------|----------|
| `anthropic/` | Anthropic (Claude) | Native Anthropic API |
| `openai/` | OpenAI (GPT) | OpenAI API |
| `ollama/` | Ollama | Ollama API (localhost) |
| `openrouter/` | OpenRouter | OpenAI-compatible |
| `deepseek/` | DeepSeek | OpenAI-compatible |
| `groq/` | Groq | OpenAI-compatible |

This means you never need to specify which provider to use. Set the model string and Homun handles the rest. Any OpenAI-compatible API can be configured as an OpenAI provider with a custom `base_url`.

## Setting the Default Model

```toml
[providers]
default = "anthropic/claude-sonnet-4-5-20250514"
```

The default model is used for all conversations unless overridden per-session. Change it at any time -- this setting hot-reloads without restarting the gateway.

You can also override the model per-chat from the CLI:

```bash
homun chat -m "Explain quantum computing" --model "openai/gpt-4o"
```

## Provider Management CLI

Homun includes CLI commands for managing providers without editing TOML:

```bash
# List all configured providers and their health status
homun provider list

# Add a provider with API key
homun provider add anthropic --api-key "sk-ant-..."

# Add a provider with custom base URL
homun provider add openai --api-key "sk-..." --api-base "https://proxy.example.com/v1"

# Remove a provider
homun provider remove deepseek
```

## Anthropic (Claude)

Anthropic is the recommended provider. Claude models have native tool use, extended thinking, and vision support -- all features that Homun uses extensively.

```toml
[providers.anthropic]
api_key = "sk-ant-api03-..."
```

Get your API key from [console.anthropic.com](https://console.anthropic.com/).

### Available Models

| Model | Speed | Cost | Best For |
|-------|-------|------|----------|
| `anthropic/claude-sonnet-4-5-20250514` | Fast | Medium | Recommended default. Strong tool use, fast responses |
| `anthropic/claude-opus-4-20250514` | Slower | Higher | Complex reasoning, nuanced tasks, long documents |
| `anthropic/claude-haiku-3-5` | Fastest | Lowest | Quick lookups, simple tasks, cost-sensitive workflows |

### Capabilities

All Claude models support:
- **Vision**: analyze images attached to messages
- **Tool use**: native function calling (no XML fallback needed)
- **Extended thinking**: chain-of-thought reasoning for complex problems (Sonnet 4.5 and Opus 4)
- **Streaming**: real-time token-by-token responses
- **200K context window**: process large documents in a single conversation

### Extended Thinking

Claude Sonnet 4.5 and Opus 4 support extended thinking mode, where the model reasons through complex problems step-by-step before answering. Homun enables this automatically when the model supports it. The thinking process is not shown to the user -- only the final answer appears.

Extended thinking is particularly useful for:
- Multi-step tool use chains
- Complex code analysis
- Tasks requiring careful planning before execution
- Mathematical or logical reasoning

### Testing Your Setup

After configuring, verify the connection:

```bash
homun chat -m "Hello, what model are you?"
```

You should see a response identifying the Claude model. If you get an error, check that your API key is valid and has not been revoked.

### Storing Keys Securely

Instead of putting your API key directly in `config.toml`, use the encrypted vault:

```bash
# Store in vault
homun vault set ANTHROPIC_API_KEY "sk-ant-api03-..."

# Reference in config
homun config set providers.anthropic.api_key '${vault:ANTHROPIC_API_KEY}'
```

This keeps the key encrypted at rest and prevents accidental exposure in backups or version control.

## OpenAI (GPT)

```toml
[providers.openai]
api_key = "sk-proj-..."
```

Get your API key from [platform.openai.com](https://platform.openai.com/).

### Available Models

| Model | Speed | Cost | Best For |
|-------|-------|------|----------|
| `openai/gpt-4o` | Fast | Medium | Multimodal tasks, good general use |
| `openai/gpt-4-turbo` | Medium | Higher | High capability, longer context |
| `openai/gpt-4o-mini` | Fastest | Lowest | Simple tasks, cost optimization |

### Capabilities

| Feature | gpt-4o | gpt-4-turbo | gpt-4o-mini |
|---------|:------:|:-----------:|:-----------:|
| Vision | Yes | Yes | Yes |
| Tool use | Yes | Yes | Yes |
| Thinking | No | No | No |
| Streaming | Yes | Yes | Yes |
| Context | 128K | 128K | 128K |

### Organization ID

If your OpenAI account belongs to an organization, you can specify the org ID:

```toml
[providers.openai]
api_key = "sk-proj-..."
organization = "org-..."
```

### Custom Base URL

For OpenAI-compatible servers (vLLM, text-generation-inference, LocalAI, LiteLLM), set a custom base URL:

```toml
[providers.openai]
api_key = "sk-..."
base_url = "https://my-proxy.example.com/v1"
```

This makes any OpenAI-compatible API work with Homun as if it were OpenAI directly.

## Ollama (Local Models)

Ollama lets you run models locally with no API key, no data leaving your machine, and no usage costs. This is ideal for privacy-sensitive workflows or offline use.

### Installation

1. Install Ollama from [ollama.com](https://ollama.com)
2. Start the Ollama service:
   ```bash
   ollama serve
   ```
3. Pull a model:
   ```bash
   ollama pull llama3
   # Or a larger model for better quality:
   ollama pull llama3:70b
   ```
4. Configure Homun:
   ```toml
   [providers.ollama]
   base_url = "http://localhost:11434"
   ```
5. Set as default (optional):
   ```toml
   [providers]
   default = "ollama/llama3"
   ```

### Available Models

Any model available in the [Ollama library](https://ollama.com/library) works. Common choices:

| Model | Size | VRAM | Best For |
|-------|------|------|----------|
| `ollama/llama3` | 8B (4.7 GB) | 6 GB | General use, fast on consumer hardware |
| `ollama/llama3:70b` | 70B (40 GB) | 48 GB | Higher quality, needs beefy GPU |
| `ollama/mistral` | 7B (4.1 GB) | 6 GB | Fast, good at following instructions |
| `ollama/codellama` | 7B (3.8 GB) | 5 GB | Code generation and analysis |
| `ollama/gemma2` | 9B (5.4 GB) | 7 GB | Google's compact model, solid general use |
| `ollama/qwen2.5` | 7B (4.7 GB) | 6 GB | Strong multilingual support |
| `ollama/deepseek-coder-v2` | 16B (8.9 GB) | 12 GB | Code-focused tasks |
| `ollama/phi3` | 3.8B (2.3 GB) | 4 GB | Ultra-lightweight, runs on CPU |

### Hardware Requirements

| Model Size | RAM (CPU-only) | GPU VRAM | Performance |
|------------|:--------:|:---------:|-------------|
| 3B-4B | 8 GB | 4 GB | Fast on any modern machine |
| 7B-9B | 16 GB | 6-8 GB | Good speed with GPU, usable on CPU |
| 13B | 24 GB | 10-12 GB | Slower on CPU, needs dedicated GPU |
| 34B | 48 GB | 24 GB | Requires workstation/server GPU |
| 70B | 64 GB+ | 40-48 GB | Needs high-end GPU (A100, dual 4090) |

Without a GPU, Ollama falls back to CPU inference, which works but is 5-20x slower depending on model size. For 7B models on a modern MacBook (M1/M2/M3), CPU performance is acceptable.

### Capabilities and XML Fallback

Most Ollama models lack native tool use (function calling). Homun automatically detects this and uses its **XML dispatch system** -- it formats tool definitions as XML instructions in the system prompt and parses XML-formatted tool calls from the model's text output. This works but is slightly less reliable than native function calling.

| Feature | Support |
|---------|---------|
| Vision | Varies by model (llava, bakllava support it) |
| Tool use | XML fallback (automatic) |
| Thinking | No |
| Streaming | Yes |

### Remote Ollama Server

If Ollama runs on a different machine (e.g., a GPU server on your network):

```toml
[providers.ollama]
base_url = "http://192.168.1.100:11434"
```

Make sure the Ollama server is configured to accept remote connections by setting `OLLAMA_HOST=0.0.0.0` on the server.

### Verifying Ollama Setup

```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# List available models
ollama list

# Test through Homun
homun chat -m "Hello" --model "ollama/llama3"
```

## OpenRouter

OpenRouter provides access to 100+ models from multiple providers through a single API key and unified billing.

```toml
[providers.openrouter]
api_key = "sk-or-v1-..."
```

Get your API key from [openrouter.ai/keys](https://openrouter.ai/keys).

### Model Naming Convention

OpenRouter model strings use a double-prefix format: `openrouter/` followed by the OpenRouter model ID:

```
openrouter/anthropic/claude-3.5-sonnet
openrouter/meta-llama/llama-3.1-405b-instruct
openrouter/google/gemini-pro-1.5
openrouter/mistralai/mixtral-8x22b-instruct
openrouter/microsoft/phi-3-medium-128k-instruct
openrouter/cohere/command-r-plus
```

Browse all available models at [openrouter.ai/models](https://openrouter.ai/models).

### When to Use OpenRouter

OpenRouter is ideal when you want:
- Access to models from providers Homun does not natively support (Google Gemini, Cohere, etc.)
- A single bill for multiple providers
- Automatic routing to the cheapest available instance of a model
- Access to open-weight models (Llama, Mixtral) without running them locally

### Cost Tracking

OpenRouter provides per-request cost tracking on their dashboard. Homun does not track OpenRouter costs separately, but the Homun dashboard shows request counts and token usage for monitoring purposes.

## DeepSeek

DeepSeek offers high-quality models at competitive pricing, particularly strong for coding tasks.

```toml
[providers.deepseek]
api_key = "sk-..."
```

Get your API key from [platform.deepseek.com](https://platform.deepseek.com/).

### Available Models

| Model | Context | Best For |
|-------|---------|----------|
| `deepseek/deepseek-chat` | 64K | General conversation, reasoning |
| `deepseek/deepseek-coder` | 64K | Code generation, debugging, analysis |

Both models support tool use and streaming. DeepSeek models do not support vision.

### Cost Advantage

DeepSeek is one of the most cost-effective providers. At roughly $0.14/M input tokens and $0.28/M output tokens, it costs 10-20x less than Claude Sonnet. Consider it for high-volume tasks like cron jobs and automations where cost matters more than peak quality.

## Groq (Fast Inference)

Groq provides extremely fast inference using their custom LPU hardware. Response times are typically 5-10x faster than other providers.

```toml
[providers.groq]
api_key = "gsk_..."
```

Get your API key from [console.groq.com](https://console.groq.com/).

### Available Models

| Model | Context | Best For |
|-------|---------|----------|
| `groq/llama3-70b-8192` | 8K tokens | Fast general use |
| `groq/llama3-8b-8192` | 8K tokens | Ultra-fast simple tasks |
| `groq/mixtral-8x7b-32768` | 32K tokens | Longer contexts, fast |
| `groq/gemma-7b-it` | 8K tokens | Fast, lightweight |

Groq models support streaming and tool use. They do not support vision.

### Rate Limits

Groq's free tier has strict rate limits:

| Limit Type | Free Tier |
|------------|-----------|
| Requests per minute | 30 |
| Tokens per minute | 14,400 (some models) |
| Requests per day | 14,400 |

If you hit limits frequently, consider using Groq as a fallback rather than primary provider, or upgrade to a paid plan for higher limits.

### Best Use Case

Groq excels as a "fast response" fallback. Configure it in your failover chain for quick simple tasks when your primary provider is slow or overloaded:

```toml
[providers]
default = "anthropic/claude-sonnet-4-5-20250514"
fallback = ["groq/llama3-70b-8192", "ollama/llama3"]
```

## Model Capabilities Reference

Quick reference for all supported model capabilities:

| Model | Vision | Tool Use | Thinking | Streaming | Context |
|-------|:------:|:--------:|:--------:|:---------:|:-------:|
| Claude Sonnet 4.5 | Yes | Native | Yes | Yes | 200K |
| Claude Opus 4 | Yes | Native | Yes | Yes | 200K |
| Claude Haiku 3.5 | Yes | Native | No | Yes | 200K |
| GPT-4o | Yes | Native | No | Yes | 128K |
| GPT-4 Turbo | Yes | Native | No | Yes | 128K |
| GPT-4o-mini | Yes | Native | No | Yes | 128K |
| Ollama (varies) | Some | XML | No | Yes | Varies |
| DeepSeek Chat | No | Native | No | Yes | 64K |
| DeepSeek Coder | No | Native | No | Yes | 64K |
| Groq Llama 3 70B | No | Native | No | Yes | 8K |
| Groq Mixtral 8x7B | No | Native | No | Yes | 32K |

**Tool Use column**: "Native" means the model supports function calling natively through its API. "XML" means Homun uses its XML-based dispatch fallback, which works but is slightly less reliable. The fallback is automatic -- you do not need to configure anything.

### How Capability Detection Works

Homun auto-detects capabilities per model at startup. The detection logic lives in `provider/capabilities.rs` and uses the model name to determine what features are available. You do not need to configure capabilities manually. If Homun gets it wrong for a custom model, the worst case is that it tries a feature and falls back gracefully.

## Failover Chain

Configure fallback models so Homun keeps working if your primary provider goes down:

```toml
[providers]
default = "anthropic/claude-sonnet-4-5-20250514"
fallback = ["openai/gpt-4o", "groq/llama3-70b-8192", "ollama/llama3"]
```

When a request to the default model fails, Homun tries each fallback in order. The failover behavior is managed by the ReliableProvider wrapper.

### How Failover Works

1. Homun sends the request to the default model
2. If the request fails (network error, 5xx, rate limit), the circuit breaker marks the provider as unhealthy
3. Homun tries the first fallback model
4. If that also fails, it tries the next, and so on
5. If all models fail, Homun returns an error to the user
6. The circuit breaker periodically tests unhealthy providers and restores them when they recover

### Circuit Breaker Details

Each provider has an independent circuit breaker that tracks failures:

- **Failure threshold**: after 3 consecutive failures, the provider is marked as "open" (unhealthy)
- **Recovery probe**: every 60 seconds, one test request is sent to check if the provider has recovered
- **Half-open state**: if the probe succeeds, the provider moves to "half-open" and the next real request determines if it fully recovers
- **Full recovery**: after a successful real request in half-open state, the provider is marked healthy again

Circuit breaker states:

| State | Meaning | Behavior |
|-------|---------|----------|
| Closed | Healthy | Requests flow normally |
| Open | Unhealthy | All requests skip this provider, use fallback |
| Half-Open | Testing | One probe request allowed to test recovery |

You can monitor provider health in the Web UI dashboard or with:

```bash
homun status
```

### Retry Logic

Before triggering failover, Homun retries failed requests with exponential backoff:

- **Retries**: up to 2 retries per provider
- **Backoff**: 1s, then 2s (doubles each attempt)
- **Retryable errors**: network timeouts, 429 (rate limit), 500/502/503 (server errors)
- **Non-retryable errors**: 401 (bad key), 400 (bad request), 404

The total time before failover triggers is at most ~3 seconds (initial request + 1s + 2s retries).

## Model Selection Guide

Different tasks work best with different models. Here is a guide for choosing:

| Use Case | Recommended Model | Why |
|----------|-------------------|-----|
| Daily assistant (default) | Claude Sonnet 4.5 | Best balance of quality, speed, and cost |
| Complex analysis | Claude Opus 4 | Strongest reasoning, worth the higher cost |
| Cron jobs / automations | Claude Haiku 3.5 or DeepSeek | Cost-effective for repetitive tasks |
| Code generation | Claude Sonnet 4.5 or DeepSeek Coder | Strong code understanding |
| Privacy-sensitive tasks | Ollama (any) | Data never leaves your machine |
| Fast simple lookups | Groq Llama 3 | Sub-second responses |
| Multi-provider access | OpenRouter | Access any model with one key |

## Cost Comparison

| Provider | Approximate Cost (per 1M tokens) | Notes |
|----------|----------------------------------|-------|
| Anthropic Claude Sonnet | ~$3 input / $15 output | Good balance of cost and capability |
| Anthropic Claude Opus | ~$15 input / $75 output | Use for complex tasks only |
| Anthropic Claude Haiku | ~$0.25 input / $1.25 output | Great for high-volume, simple tasks |
| OpenAI GPT-4o | ~$2.50 input / $10 output | Competitive with Sonnet |
| OpenAI GPT-4o-mini | ~$0.15 input / $0.60 output | Budget-friendly GPT option |
| DeepSeek Chat | ~$0.14 input / $0.28 output | Very cost-effective |
| Groq | Free tier available | Rate-limited; paid plans available |
| Ollama | Free (hardware cost only) | Requires local GPU for best speed |

**Tips for cost management**:
- Use Claude Haiku or GPT-4o-mini for cron jobs and simple automations
- Reserve Opus for complex reasoning tasks
- Use Ollama as a free local fallback
- Monitor usage on your provider's dashboard
- Consider DeepSeek for high-volume batch operations

## Advanced Configuration

### Custom Base URLs

For providers behind a proxy or self-hosted API-compatible servers:

```toml
[providers.openai]
api_key = "sk-..."
base_url = "https://my-proxy.example.com/v1"

[providers.ollama]
base_url = "http://gpu-server.local:11434"
```

This also works for any OpenAI-compatible server (vLLM, text-generation-inference, LocalAI, LiteLLM, etc.) by configuring it as an OpenAI provider with a custom base URL.

### Using a Proxy Server

If your network requires an HTTP proxy for outbound API calls, set the standard environment variables:

```bash
export HTTPS_PROXY="http://proxy.example.com:8080"
export HTTP_PROXY="http://proxy.example.com:8080"
export NO_PROXY="localhost,127.0.0.1"
```

These are picked up by the underlying HTTP client (reqwest) automatically.

### One-Shot Engine

Internally, Homun uses a dedicated "one-shot" LLM engine (`provider/one_shot.rs`) for non-conversational calls: automation generation, MCP setup assistance, skill creation, and other utility tasks. This engine uses the default model with extended thinking disabled and a 30-second timeout. You do not need to configure it separately.
