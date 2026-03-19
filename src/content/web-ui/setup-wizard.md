# Setup Wizard

The setup wizard runs automatically when you access the Web UI for the first time. It walks you through the essential configuration to get Homun up and running in four phases: create an account, configure an LLM provider, set your preferences, and verify everything works with a test chat.

## When the Wizard Appears

The setup wizard appears when:
- You visit the Web UI for the first time (no admin account exists)
- The database has been reset or is new
- You navigate directly to the setup wizard URL

If an admin account already exists, the wizard redirects to the login page instead.

## Phase 1: Create Admin Account

The first step creates your admin account to protect access to the Web UI and all API endpoints.

### Username

Choose a username for logging in. This is the only account -- Homun uses a single-admin model. The username must be at least 3 characters and can contain letters, numbers, and underscores.

### Password

Choose a strong password. Homun enforces minimum requirements:
- At least 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

The password is hashed with PBKDF2 using 600,000 iterations before storage. The plaintext password is never stored. PBKDF2 with this many iterations makes brute-force attacks impractical.

### Single Admin

Homun supports one admin account. There is no multi-user system. All channels, tools, and configurations are tied to this single account. If you need to change the account credentials later, go to **Account** in the Web UI.

### What Happens After Account Creation

- The account is stored in the SQLite database
- A session cookie is created and you are automatically logged in
- Rate limiting activates for the login endpoint (5 attempts per minute per IP)
- All API endpoints become protected -- they require either the session cookie or an API bearer token

## Phase 2: Configure LLM Provider

The second step connects Homun to an LLM provider. This is required -- without an LLM, Homun cannot process messages or use tools.

### Provider Selection

Choose from the supported providers:

| Provider | Models | API Key Required | Notes |
|----------|--------|:----------------:|-------|
| **Anthropic** | Claude Opus, Sonnet, Haiku | Yes | Recommended. Best tool use support. |
| **OpenAI** | GPT-4o, GPT-4o-mini, o1, o3 | Yes | Widely available, strong general performance. |
| **Ollama** | Llama, Mistral, Qwen, etc. | No | Free, runs locally. No API key needed. |
| **OpenRouter** | 100+ models | Yes | Access many providers with one key. |
| **DeepSeek** | DeepSeek-V3, DeepSeek-R1 | Yes | Strong reasoning, competitive pricing. |
| **Groq** | Llama, Mixtral (fast inference) | Yes | Very fast, good for latency-sensitive tasks. |

### API Key Entry

For cloud providers, enter your API key. The wizard validates the key by making a test call to the provider's API.

- **Anthropic**: get your key from [console.anthropic.com](https://console.anthropic.com)
- **OpenAI**: get your key from [platform.openai.com](https://platform.openai.com)
- **OpenRouter**: get your key from [openrouter.ai](https://openrouter.ai)
- **DeepSeek**: get your key from [platform.deepseek.com](https://platform.deepseek.com)
- **Groq**: get your key from [console.groq.com](https://console.groq.com)

The API key is stored encrypted in the vault, not in plaintext in the config file.

### Ollama Setup

If you choose Ollama (local LLM), the wizard checks:
1. Is Ollama installed? (`ollama --version`)
2. Is the Ollama service running? (checks `http://localhost:11434`)
3. Which models are available? (`ollama list`)

If Ollama is not installed, the wizard provides installation instructions. If no models are downloaded, it suggests popular options and can pull them for you.

### Model Selection

After connecting to a provider, select a default model. The wizard shows available models with their capabilities:

- **Vision**: can the model process images?
- **Tool use**: does the model support function calling?
- **Extended thinking**: does the model support chain-of-thought reasoning?
- **Context window**: how many tokens can the model handle?

Choose a model that supports tool use for the best experience. Models without tool use still work but use an XML-based fallback for calling tools, which is less reliable.

### Test Connection

The wizard makes a test API call to verify:
- The API key is valid
- The selected model is accessible
- The response comes back successfully

If the test fails, the wizard shows the error (invalid key, model not found, network issue) and lets you try again.

### Configuration Result

After this phase, the wizard writes to `~/.homun/config.toml`:

```toml
[providers.anthropic]
api_key = "***ENCRYPTED***"
default_model = "claude-sonnet-4-20250514"
```

The API key is encrypted using the vault's AES-256-GCM encryption. The `***ENCRYPTED***` marker in the config file indicates an encrypted value.

## Phase 3: Theme and Preferences

The third step customizes your experience. All settings here are optional and can be changed later.

### Theme

Choose between:
- **Dark mode**: the default, dark background with light text. Optimized for extended use and low-light environments.
- **Light mode**: light background with dark text. Better for well-lit environments.
- **System**: follows your operating system's preference. Switches automatically with your OS theme.

### Accent Color

Pick a color for buttons, links, highlights, and active states. The accent color is used consistently throughout the UI. Choose from a curated set of hues, or enter a custom hex color.

The accent automatically adapts for contrast in both dark and light themes.

### Language

Set the default language for Homun's responses. This tells the LLM which language to use when replying. You can always override this in conversation by asking Homun to respond in a specific language.

### Agent Personality (Optional)

Optionally write a few lines describing how you want Homun to communicate. This is written to `~/.homun/brain/SOUL.md` and included in every conversation's system prompt.

Examples:
- "Be concise and direct. Skip pleasantries."
- "Use a friendly, casual tone. Include examples when explaining."
- "Respond formally. Prioritize accuracy over brevity."

You can skip this and add or change it later in the SOUL.md file or from the Memory page.

## Phase 4: Test Chat

The final step verifies everything works end-to-end by opening a live chat session directly in the wizard.

### What Happens

1. A WebSocket connection is established to the gateway
2. You type a test message (the wizard suggests one, or you can type your own)
3. The message is sent through the full agent pipeline: LLM processes it, tools are available, memory is active
4. The response streams back in real-time, token by token
5. The wizard confirms success

### What It Tests

- WebSocket connectivity between browser and gateway
- LLM provider connection (API key, model, network)
- Streaming response rendering
- Tool availability (the agent can call tools if needed)
- The full message pipeline (inbound -> agent loop -> outbound)

### If the Test Fails

The wizard diagnoses common issues:

| Problem | Diagnosis | Suggested Fix |
|---------|-----------|---------------|
| No response | LLM provider unreachable | Check API key, network, provider status |
| Timeout | Request took too long | Try a faster model, check network latency |
| Error message | Provider returned an error | Read the error, fix API key or model name |
| WebSocket disconnected | Connection dropped | Check gateway logs, try refreshing the page |

You can retry the test as many times as needed. Once you get a successful response, click **Complete Setup** to finish.

## After the Wizard

Once the wizard completes, you are taken to the Dashboard. From here, you can:

1. **Start chatting**: go to **Chat** and start a conversation
2. **Add channels**: go to **Channels** to connect Telegram, Discord, Slack, WhatsApp, or Email
3. **Import knowledge**: go to **Knowledge** to upload documents for the RAG knowledge base
4. **Install skills**: go to **Skills** to browse and install skills from the marketplace
5. **Set up automations**: go to **Automations** to schedule recurring tasks
6. **Configure security**: go to **Vault** to store API keys, go to **Account** for 2FA setup

### Recommended First Steps

1. **Add at least one messaging channel** (Telegram is the easiest to set up) so Homun can reach you proactively
2. **Tell Homun about yourself**: "Remember that I'm a developer working on project X" -- this seeds the user profile
3. **Store any API keys** you want skills to use in the Vault
4. **Set up a morning briefing** cron job to see automations in action

## Re-Running the Wizard

The full wizard runs only once (on first access). After that, you can change any setting individually:

- **LLM provider**: Settings > Providers
- **Theme and accent**: Account > Appearance
- **Password**: Account > Security
- **Agent personality**: Memory > SOUL.md

There is no need to re-run the full wizard. Each setting page provides the same functionality with more options.

### Resetting Everything

If you want to start fresh (new account, new config):

1. Stop the gateway
2. Delete the database: `rm ~/.homun/homun.db`
3. Optionally delete the config: `rm ~/.homun/config.toml`
4. Start the gateway again: `homun gateway`
5. The wizard will appear on next Web UI access

This resets all data: conversations, memories, skills, automations. The knowledge base files on disk remain, but their index is lost. Use this as a last resort.

## Troubleshooting

### Wizard Does Not Appear

**Symptom**: you go to the Web UI but see the login page instead of the wizard.

**Cause**: an admin account already exists.

**Fix**: log in with your existing credentials. If you forgot the password, you need to reset the database (see "Resetting Everything" above).

### API Key Rejected

**Symptom**: the wizard says the API key is invalid.

**Check**:
1. Verify you copied the full key (no trailing spaces)
2. Check that the key has not been revoked on the provider's dashboard
3. For Anthropic: ensure the key has "Messages" permissions
4. For OpenAI: ensure the key has chat completion permissions
5. Check your network -- the wizard needs to reach the provider's API

### Test Chat Shows No Response

**Symptom**: you send a test message but nothing comes back.

**Check**:
1. Look at the gateway logs for errors: `RUST_LOG=debug homun gateway`
2. Verify the LLM provider is reachable from your server
3. Check if a firewall is blocking outgoing HTTPS connections
4. Try a different model -- some models may be unavailable or overloaded

### Ollama Not Detected

**Symptom**: wizard says Ollama is not installed or not running.

**Check**:
1. Verify Ollama is installed: `ollama --version`
2. Start the Ollama service: `ollama serve`
3. Check it is accessible: `curl http://localhost:11434/api/tags`
4. If running in Docker, ensure the Ollama port is mapped to the host
