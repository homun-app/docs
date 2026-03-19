# Browser Automation

Homun can browse the web autonomously using a built-in headless browser. It navigates pages, fills forms, clicks buttons, extracts information, and handles multi-step browsing tasks -- all controlled by the AI agent. This page covers setup, all 17 actions, stealth mode, persistent sessions, task planning, and practical examples.

## How It Works

Browser automation is powered by **Playwright MCP** (`@playwright/mcp`), a Model Context Protocol server that gives Homun programmatic control over a real browser. The architecture works as follows:

1. Homun spawns a persistent MCP Playwright process via `npx`
2. The browser launches (headless by default) with a user data directory for persistent sessions
3. When the agent needs to browse, it calls the unified `browser` tool with one of 17 actions
4. Each action returns a result: a screenshot, an accessibility snapshot, page content, or a confirmation
5. The MCP connection persists across tool calls, so the browser stays open between actions

The browser is a real Chromium instance (or Firefox/WebKit), not a simplified fetcher. It executes JavaScript, renders CSS, handles cookies, and interacts with dynamic SPAs exactly like a human user would.

### When to Use Browser vs. Web Fetch

Homun has two ways to access web content:

| Feature | `web_fetch` tool | `browser` tool |
|---------|-----------------|----------------|
| Speed | Fast (single HTTP request) | Slower (full browser) |
| JavaScript | No JS execution | Full JS execution |
| Dynamic content | Static HTML only | SPAs, infinite scroll, client-rendered content |
| Authentication | No cookie/session support | Persistent login sessions |
| Interaction | Read-only | Click, type, scroll, fill forms |
| Resource usage | Minimal | Memory-intensive (browser process) |

The agent automatically chooses the right tool. For simple page reads, it uses `web_fetch`. For interactive tasks, forms, or JavaScript-heavy sites, it uses the browser.

## Setup

### Prerequisites

- **Node.js** must be installed on your system (v18 or later)
- Playwright is installed automatically via `npx @playwright/mcp` on first use
- No manual browser installation needed -- Playwright downloads the browser binary

Verify Node.js is available:

```bash
node --version    # Should be v18 or later
npx --version
```

### Configuration

Enable browser automation in your config:

```toml
[browser]
enabled = true
headless = true
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | Boolean | `false` | Enable/disable browser automation. Hot-reloads without restart. |
| `headless` | Boolean | `true` | Run the browser without a visible window. Set to `false` for debugging. |
| `browser_type` | String | `"chromium"` | Browser engine: `"chromium"`, `"firefox"`, or `"webkit"`. |

The `enabled` and `headless` settings hot-reload -- changes take effect on the next browser session without restarting the gateway.

### First-Time Setup

On first use, Playwright downloads the browser binary (about 200-400 MB depending on the browser). This happens automatically and only once. Subsequent launches use the cached binary.

If you are behind a proxy or firewall, you may need to set the `PLAYWRIGHT_DOWNLOAD_HOST` environment variable. See the Playwright documentation for proxy configuration.

## Browser Actions

The unified `browser` tool supports 17 actions organized by category.

### Navigation

| Action | Description | Key Parameters |
|--------|-------------|----------------|
| `navigate` | Go to a URL | `url` (required) |
| `go_back` | Navigate back in history | None |
| `go_forward` | Navigate forward in history | None |
| `tabs` | List, create, close, or switch browser tabs | `action` (list/new/close/select), `index` |

**navigate** waits for the page to finish loading before returning. It also runs a stability check (see Auto-Snapshot below) to ensure the DOM has settled.

**tabs** supports multi-tab browsing. The agent can open links in new tabs, work on multiple pages simultaneously, and switch between them.

### Interaction

| Action | Description | Key Parameters |
|--------|-------------|----------------|
| `click` | Click an element by reference | `ref` (element reference from snapshot) |
| `type` | Type text into a field | `ref`, `text`, `slowly` (for keystroke events) |
| `fill_form` | Fill multiple form fields at once | `fields` (array of ref/value pairs) |
| `select` | Choose from a dropdown | `ref`, `values` |
| `hover` | Hover over an element | `ref` |
| `press_key` | Press a keyboard key | `key` (e.g., "Enter", "Tab", "Escape") |
| `upload` | Upload a file to a file input | `paths` (file paths) |

The `slowly` parameter on the `type` action sends individual keystrokes instead of pasting the entire text at once. This is important for fields with autocomplete or real-time validation that depend on keydown/keyup events.

**fill_form** is more efficient than multiple `type` calls for forms with many fields. It fills all fields in a single action.

### Observation

| Action | Description | Key Parameters |
|--------|-------------|----------------|
| `screenshot` | Capture a visual screenshot of the page | `fullPage` (optional) |
| `snapshot` | Get an accessibility tree of the page | None |
| `evaluate` | Run JavaScript on the page | `function` (JavaScript code) |
| `wait` | Wait for text to appear or disappear | `text`, `textGone`, or `time` |

**snapshot** is the most frequently used observation action. It returns the page's accessibility tree with element references that can be used in interaction actions. This is how the agent "sees" the page.

**screenshot** captures a visual image. Useful for debugging, showing the user what the browser sees, or analyzing visual layouts that are not well represented in the accessibility tree.

**evaluate** executes arbitrary JavaScript in the page context. Useful for reading page variables, extracting data from complex DOM structures, or triggering client-side functions.

### Advanced

| Action | Description | Key Parameters |
|--------|-------------|----------------|
| `run_code` | Execute arbitrary Playwright code | `code` (JavaScript with Playwright API) |

**run_code** gives full access to the Playwright API. This is the most powerful action and is used for complex scenarios that the other actions cannot handle, such as intercepting network requests or modifying page behavior.

### Element References

Most interaction actions use element **references** (`ref`) rather than CSS selectors. The workflow is:

1. Take a `snapshot` to get the accessibility tree with element references
2. Each element has a reference ID like `ref_1`, `ref_2`, etc.
3. Use the reference in subsequent actions: `click ref_1`, `type ref_2 "hello"`

This approach is more reliable than CSS selectors because:
- References point to specific elements in the current page state
- They work even when elements lack IDs or stable class names
- The snapshot provides the full context (text, role, state) for each element
- The agent can read the element's label and role to confirm it is clicking the right thing

After any action that changes the page (click, type, navigate), Homun takes a new snapshot automatically. Old references become invalid -- always use references from the latest snapshot.

## Anti-Bot Stealth

Homun automatically injects stealth techniques when launching the browser. This makes the automated browser appear like a regular user session to website bot-detection systems.

### What Stealth Does

- Masks `navigator.webdriver` to prevent detection of automated control
- Patches browser fingerprinting APIs (WebGL, Canvas, AudioContext)
- Sets realistic `navigator.plugins` and `navigator.languages`
- Overrides `chrome.runtime` to simulate a regular Chrome installation
- Sets a natural user-agent string matching a real browser version

Stealth injection happens via `addInitScript`, meaning it runs before any page JavaScript executes. The page never sees the unmasked values.

### Limitations

Stealth works against most standard bot detection. It does not bypass:
- **CAPTCHAs**: Homun cannot solve CAPTCHAs. If a page shows one, Homun reports it and asks for your help.
- **Advanced fingerprinting**: some commercial anti-bot services (Cloudflare Turnstile, PerimeterX) may still detect automation through behavioral analysis or canvas fingerprinting.
- **Rate limiting**: rapid requests from a single IP may trigger IP-based blocks regardless of fingerprint.
- **Login walls**: sites requiring authentication will need you to log in first (see Persistent Sessions).

## Persistent Sessions

The browser uses a persistent user data directory, which means state is preserved across browsing sessions:

| What Persists | Benefit |
|--------------|---------|
| Cookies | Stay logged in to websites |
| localStorage | Site preferences and session tokens survive |
| IndexedDB | Web app data is retained |
| Service workers | PWA functionality works |

This is especially useful for tasks that require authentication. Log in once (manually or with Homun's help), and subsequent browser tasks can access the authenticated session without re-entering credentials.

### Where Data Is Stored

Browser profile data is stored in `~/.homun/browser/` (or a subdirectory of your data directory). You can delete this directory to reset all browser state (cookies, login sessions, cached data).

### Managing Logged-In Sessions

Since sessions persist, you can:
1. Set `headless = false` temporarily to see the browser window
2. Log in to the sites you need Homun to access
3. Set `headless = true` again for normal operation

Homun can also log in programmatically if you provide credentials via the vault. However, for security-sensitive sites with 2FA, manual login is recommended.

## Task Planning

When Homun receives a complex browsing task, it does not blindly click through pages. It plans the task using a structured approach.

### Planning Process

1. **Goal decomposition**: break the task into discrete steps (navigate, find element, interact, extract data)
2. **State tracking**: maintain awareness of what page is loaded, what has been done, what remains
3. **Veto system**: before each action, evaluate whether it makes sense given the current page state. If the page changed unexpectedly, re-plan.
4. **Recovery**: if an action fails (element not found, page changed), re-evaluate and adjust the plan

### Compact Snapshots

Accessibility snapshots can be large (thousands of nodes for complex pages). Homun compresses them using a tree-preserving compaction algorithm:

- Elements without content or interactive roles are pruned
- Deep nesting is flattened while preserving parent-child relationships for context
- Reference IDs are preserved so interaction actions still work
- The result is typically 70-90% smaller than the raw snapshot

This lets the LLM understand page structure without consuming excessive context tokens.

### Auto-Snapshot

Homun automatically takes a snapshot after certain actions to get fresh element references:

| Action | Auto-Snapshot | Why |
|--------|:-------------:|-----|
| `navigate` | Yes (after stability check) | Page changed, need new references |
| `click` | Yes | Click may have changed the page (navigation, modal, etc.) |
| `type` | Yes | Typing may trigger autocomplete or page updates |
| `fill_form` | Yes | Form state changed |
| `select` | Yes | Selection may trigger dependent fields or page updates |

The stability check after `navigate` waits for the page to stop loading (DOM stops changing) before taking the snapshot, with up to 5 retries. This handles slow-loading SPAs and pages with progressive rendering.

## Use Cases

### Web Research

Ask Homun to research a topic across multiple sources:

> "Research the latest developments in Rust async runtimes. Check the official Tokio blog, recent Reddit discussions, and any new crates on crates.io. Write a summary."

Homun navigates to each source, extracts relevant information, and compiles a summary with citations.

### Form Filling

> "Go to the insurance portal and fill out the renewal form with my information. Stop before submitting -- I want to review it first."

Homun navigates to the form, fills in fields from memory and context, takes a screenshot for your review, and waits for approval.

### Data Extraction

> "Go to the competitor pricing page at example.com/pricing and extract all plan names, prices, and features into a table."

Homun navigates, reads the page structure via snapshot, and returns a formatted markdown table.

### Price Monitoring

Combine with cron for regular checks:

```bash
homun cron add "0 */6 * * *" "Check the price of [product] on [website]. If it dropped below $50, send me a Telegram alert with the current price and link."
```

### Testing Web Applications

> "Navigate to our staging site at staging.example.com, log in with the test account, create a new project, and verify the dashboard shows it."

Homun executes each step, reporting results and screenshots along the way. This is useful for smoke testing after deployments.

### Social Media Monitoring

> "Check my company's mentions on Twitter from the last 24 hours. Summarize the sentiment and highlight any complaints."

Homun browses the platform, collects mentions, and provides a sentiment analysis.

## Security

### Browser Content Isolation

The browser runs in a separate process from the Homun agent. Content from web pages is treated as untrusted:
- Page content is read but not executed as agent instructions
- JavaScript on pages cannot access Homun's internal state
- The exfiltration guard monitors data flowing from the browser to prevent sensitive data leaks

### Credential Handling

If a task requires login credentials:
- Store them in the vault: `homun vault set SITE_USERNAME "user"` and `homun vault set SITE_PASSWORD "pass"`
- Homun retrieves them from the vault when needed
- Credentials are never logged or included in chat responses
- After typing credentials into a form, they are cleared from the agent's context

## Troubleshooting

### Playwright Not Installed

**Symptom**: browser tool returns "Cannot find module @playwright/mcp"

**Fix**: ensure Node.js and npx are available:

```bash
node --version    # Should be v18+
npx --version
```

If Node.js is installed but npx fails, try:

```bash
npm install -g npx
```

### Browser Crashes on Startup

**Symptom**: browser tool returns a timeout or crash error on first action.

**Fix for Linux servers**: headless Chromium needs system libraries:

```bash
# Debian/Ubuntu
sudo apt install libnss3 libatk-bridge2.0-0 libdrm2 libxcomposite1 \
  libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2
```

**Fix for Docker**: use an image that includes browser dependencies, or install them in your Dockerfile.

**Fix for macOS**: if using Apple Silicon, ensure you have the ARM version of Node.js. The x86 version running under Rosetta may have issues with Playwright.

### Page Not Loading

**Symptom**: `navigate` succeeds but the snapshot is empty or incomplete.

**Causes**:
- **JavaScript-heavy SPA**: the page needs time to render. Try adding a `wait` action for specific text to appear before taking a snapshot.
- **Bot detection**: the site is blocking automated browsers. Some sites with advanced anti-bot systems cannot be automated.
- **Network issues**: check that the URL is reachable from the server. Firewalls or proxies may block outgoing connections.

### Element Not Found

**Symptom**: `click` or `type` returns "Element ref_X not found"

**Causes**:
- The page changed since the last snapshot. Take a new `snapshot` and use fresh references.
- The element is inside an iframe. Homun does not automatically switch to iframes -- use `evaluate` to access iframe content.
- The element is hidden (display: none, visibility: hidden). It may need a hover or click on a parent element to become visible first.
- The element loads dynamically. Use `wait` to wait for the element's text to appear before interacting.

### Slow Page Loading

**Symptom**: browser actions take a long time to complete.

**Causes**:
- Large pages with many resources. The stability check waits for the DOM to settle, which takes longer on complex pages.
- Slow network connection. Browser automation requires downloading all page resources (CSS, JS, images).
- Memory pressure. Each browser tab uses 100-500 MB of memory. Close unused tabs.

### Headless vs. Headed Mode

For debugging browser issues, switch to headed mode to see what the browser is doing:

```toml
[browser]
headless = false
```

This opens a visible browser window. You can watch the agent navigate, click, and type in real time. Useful during development and debugging, but not suitable for servers without a display.

On a remote server without a display, you can use VNC or a remote desktop to view the headed browser.
