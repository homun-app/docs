# Browser Automation

Homun can browse the web autonomously using a built-in headless browser. It navigates pages, fills forms, clicks buttons, and extracts information -- all controlled by the AI agent.

## Setup

Browser automation uses Playwright MCP under the hood. Enable it in your config:

```toml
[browser]
enabled = true
headless = true
```

Playwright is installed automatically via `npx @playwright/mcp` on first use. Node.js must be available on your system.

### Browser Options

```toml
[browser]
enabled = true
headless = true           # false to see the browser window
browser_type = "chromium" # chromium, firefox, or webkit
```

## How It Works

When Homun needs to browse the web, it uses a unified `browser` tool with 17 available actions:

| Action | Description |
|--------|-------------|
| `navigate` | Go to a URL |
| `click` | Click an element |
| `type` | Type text into a field |
| `screenshot` | Capture the current page |
| `snapshot` | Get an accessibility tree of the page |
| `scroll` | Scroll the page |
| `select` | Choose from a dropdown |
| `hover` | Hover over an element |
| `wait` | Wait for content to appear |
| `go_back` | Navigate back |
| `go_forward` | Navigate forward |
| `fill_form` | Fill multiple form fields at once |
| `press_key` | Press a keyboard key |
| `tabs` | Manage browser tabs |
| `evaluate` | Run JavaScript on the page |
| `upload` | Upload files |
| `run_code` | Execute Playwright code |

## Anti-Bot Stealth

Homun automatically injects stealth techniques to avoid bot detection. This includes masking the automated browser fingerprint so websites treat it like a regular browser session.

## Persistent Sessions

The browser uses a persistent user data directory, which means:

- Cookies survive between tasks
- Login sessions are maintained
- Site preferences are remembered

## Use Cases

- **Web research** -- search and summarize information from multiple sources
- **Form filling** -- complete web forms with your data
- **Data extraction** -- pull structured data from web pages
- **Monitoring** -- check websites for changes
- **Testing** -- verify web applications

## Example

Ask Homun to browse the web naturally:

> "Go to the weather website and tell me the forecast for tomorrow in Rome."

Homun will navigate to the site, find the relevant information, and report back with the results.
