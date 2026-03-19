# LLM Providers

Homun supports multiple LLM providers. You can configure a default model and set up failover to alternative providers when the primary is unavailable.

## Setting the Default Model

```toml
[providers]
default = "anthropic/claude-sonnet-4-5-20250514"
```

The model string format is `provider/model-name`. Homun automatically routes to the correct provider based on the prefix.

## Anthropic (Claude)

```toml
[providers.anthropic]
api_key = "sk-ant-..."
```

Available models:
- `anthropic/claude-sonnet-4-5-20250514` -- Fast, capable, recommended default
- `anthropic/claude-opus-4-20250514` -- Most capable, higher cost
- `anthropic/claude-haiku-3-5` -- Fastest, lowest cost

Features: native tool use, extended thinking, vision.

## OpenAI (GPT)

```toml
[providers.openai]
api_key = "sk-..."
```

Available models:
- `openai/gpt-4o` -- Multimodal, fast
- `openai/gpt-4-turbo` -- High capability

## Ollama (Local)

Run models locally with no API key required. Install [Ollama](https://ollama.com) first.

```toml
[providers.ollama]
base_url = "http://localhost:11434"
```

Available models (examples):
- `ollama/llama3` -- Meta's Llama 3
- `ollama/mistral` -- Mistral 7B
- `ollama/codellama` -- Code-focused

Pull a model before using it:

```bash
ollama pull llama3
```

## OpenRouter

Access 100+ models through a single API key.

```toml
[providers.openrouter]
api_key = "sk-or-..."
```

Use any model available on OpenRouter:
- `openrouter/meta-llama/llama-3-70b`
- `openrouter/google/gemini-pro`
- And many more at [openrouter.ai/models](https://openrouter.ai/models)

## DeepSeek

```toml
[providers.deepseek]
api_key = "sk-..."
```

Models:
- `deepseek/deepseek-chat` -- General purpose
- `deepseek/deepseek-coder` -- Code-focused

## Groq (Fast Inference)

```toml
[providers.groq]
api_key = "gsk_..."
```

Models:
- `groq/llama3-70b-8192` -- Fast Llama 3
- `groq/mixtral-8x7b-32768` -- Fast Mixtral

## Failover

Configure fallback models so Homun keeps working if your primary provider is down:

```toml
[providers]
default = "anthropic/claude-sonnet-4-5-20250514"
fallback = ["openai/gpt-4o", "ollama/llama3"]
```

Homun tries each model in order until one responds. A circuit breaker prevents repeated calls to a failing provider.

## Capability Detection

Homun automatically detects each model's capabilities:

| Capability | Description |
|-----------|-------------|
| Vision | Can process images |
| Tool use | Native function calling |
| Extended thinking | Chain-of-thought reasoning |
| Streaming | Real-time token streaming |

Models without native tool use fall back to an XML-based dispatch system automatically.
