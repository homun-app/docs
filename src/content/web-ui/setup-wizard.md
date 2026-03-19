# Setup Wizard

The setup wizard runs automatically when you access the Web UI for the first time. It walks you through the essential configuration to get Homun up and running.

## Phase 1: Create Admin Account

Set up your admin credentials:

- **Username** -- your login name
- **Password** -- must be strong (Homun enforces minimum requirements)

These credentials protect access to the Web UI and all of Homun's functionality.

## Phase 2: Configure LLM Provider

Choose your LLM provider and enter the API key:

- **Anthropic** (Claude) -- recommended, best tool use support
- **OpenAI** (GPT) -- widely available
- **Ollama** -- free, runs locally, no API key needed
- **OpenRouter** -- access to 100+ models with one key
- **Other providers** -- DeepSeek, Groq, and more

Select a default model to use for conversations. You can change this later in settings.

## Phase 3: Theme and Preferences

Customize your experience:

- **Dark or light mode** -- choose your preferred theme
- **Accent color** -- pick a color for buttons and highlights
- **Language** -- set the default language

## Phase 4: Test Chat

Verify everything works by sending a test message. The wizard opens a live chat session where you can:

- Confirm the LLM responds correctly
- See streaming in action
- Test tool execution

If the test fails, the wizard helps you diagnose the issue (wrong API key, network problems, etc.).

## Re-Running the Wizard

If you need to reconfigure Homun later, you can access the setup options from **Settings** in the Web UI. Individual settings (provider, theme, account) can also be changed from their respective pages without re-running the full wizard.
