# Troubleshooting

This page covers the most common problems you may encounter with Homun, organized by symptom. Start with the 60-second diagnostic ladder, then find your specific issue in the sections below.

## 60-Second Diagnostic Ladder

When something is wrong, run these checks in order. Most problems are caught in the first two steps.

**Step 1: Is Homun running?**

```bash
homun status
```

If this returns an error or shows "not running", the gateway is not started. Start it with `homun gateway`.

**Step 2: Check the logs**

```bash
RUST_LOG=debug homun gateway
```

Look for error messages at startup. The most common issues (bad config, missing API key, port conflict) show up immediately in the log output.

**Step 3: Test the LLM provider**

```bash
homun chat -m "hello"
```

If this fails with an API error, your provider is misconfigured. Check your API key and model string.

**Step 4: Check the config**

```bash
homun config show
homun config get providers.default
```

Verify the default model is set and the API key is present.

**Step 5: Check the Web UI**

Open `https://localhost:18443` in your browser. If you see a certificate warning, click through it (self-signed cert is normal). If the page does not load, the gateway is not running or the port is wrong.

## Gateway Issues

### Gateway Won't Start

**Symptom**: `homun gateway` exits immediately or shows an error.

**Config parse error**:
```
Error: invalid config at channels.web.port: expected integer, got string "abc"
```
Fix: Check `~/.homun/config.toml` for syntax errors. Run `homun config show` to see if the config loads at all. Common mistakes include missing quotes around strings, unclosed brackets, or using JSON syntax instead of TOML.

**Port already in use**:
```
Error: Address already in use (os error 48)
```
Fix: Another process is using port 18443. Find it and stop it, or change the port:
```bash
# Find what is using the port
lsof -i :18443

# Change the port
homun config set channels.web.port 18444
```

**Missing API key**:
```
Error: missing required field: providers.default
```
Fix: Set a default LLM provider:
```bash
homun config set providers.default "anthropic/claude-sonnet-4-5-20250514"
homun config set providers.anthropic.api_key "sk-ant-..."
```

**Database migration error**:
```
Error: while executing migrations: ...
```
Fix: The SQLite database may be corrupted. Back up and recreate:
```bash
cp ~/.homun/homun.db ~/.homun/homun.db.bak
rm ~/.homun/homun.db
homun gateway
```
Homun will create a fresh database with all migrations applied. You will lose conversation history but not configuration or vault secrets.

**Permission denied**:
```
Error: Permission denied (os error 13)
```
Fix: Check file permissions on `~/.homun/`. The directory and all files should be owned by your user:
```bash
ls -la ~/.homun/
# Fix permissions if needed
chmod -R u+rw ~/.homun/
```

### Gateway Crashes After Running

**Symptom**: The gateway starts but crashes after a few minutes or hours.

Check the logs for the crash message:
```bash
RUST_LOG=debug homun gateway 2>&1 | tee ~/homun-crash.log
```

Common causes:
- **Out of memory**: Large knowledge bases or many concurrent sessions can exhaust memory. Check with `homun status` and close unused sessions.
- **Database lock**: If another Homun process is running, SQLite may conflict. Ensure only one gateway is running:
  ```bash
  # Check for running processes
  pgrep -f "homun gateway"
  ```

### Gateway Starts But No Channels Connect

**Symptom**: Gateway starts, Web UI works, but Telegram/Discord/Slack do not respond.

Check that channel tokens are configured:
```bash
homun config get channels.telegram.token
homun config get channels.discord.token
```

If tokens are present but channels still fail, check the gateway logs for channel-specific errors. Common causes:
- **Invalid token**: The token was revoked or is for the wrong bot
- **Network issue**: The server cannot reach the platform's API
- **Rate limited**: The bot hit the platform's rate limit (wait and retry)

## Channel Issues

### Bot Doesn't Respond to Messages

**Symptom**: You send a message on Telegram/Discord/Slack but get no response.

1. **Check that the gateway is running**: `homun status`
2. **Check the channel is connected**: Look at the gateway startup logs for the channel name
3. **Check pairing**: If you are a new sender, you may need to complete OTP pairing first. Check the gateway logs for "pairing challenge" messages
4. **Check the token**: Verify the bot token is correct and not expired
5. **Check the LLM**: The bot may have received your message but the LLM failed. Check logs for provider errors

### Messages Are Delayed

**Symptom**: Responses come but take 30+ seconds.

- **Slow LLM response**: Complex queries or large contexts take longer. Check if the same query is fast in `homun chat -m "..."` (CLI is faster because it has no channel overhead).
- **Rate limiting**: The LLM provider may be throttling. Check the gateway logs for 429 errors.
- **Network latency**: Check your connection to the LLM provider. Try a different provider to isolate.
- **Long tool chains**: If the agent is using multiple tools (web search, file reads, etc.), each tool call adds latency. This is normal for complex tasks.

### WhatsApp Pairing Fails

**Symptom**: QR code does not appear or scanning fails.

1. Check the gateway logs for WhatsApp-related errors
2. Ensure `channels.whatsapp.enabled = true` in config
3. Try the Web UI pairing at **Channels > WhatsApp** which provides a visual QR code flow
4. If re-pairing after a disconnection, the old session may be stale. The gateway will attempt to re-pair automatically.

### Telegram Bot Doesn't Receive Messages

**Symptom**: You send messages in Telegram but the gateway logs show no incoming messages.

1. Verify the bot token with Telegram's BotFather
2. Make sure no other instance of the bot is running (Telegram only sends messages to one receiver)
3. Check if the bot was started (`/start` in Telegram)
4. Check firewall -- Telegram uses long polling over HTTPS, so outbound 443 must be open

## LLM Provider Issues

### API Key Invalid

**Symptom**: Error message mentioning "401", "unauthorized", or "invalid API key".

```bash
# Check the stored key
homun config get providers.anthropic.api_key

# Check if key is in vault
homun vault list
```

If the key looks correct, test it directly:
```bash
# Test Anthropic key
curl -H "x-api-key: sk-ant-..." \
  -H "anthropic-version: 2023-06-01" \
  https://api.anthropic.com/v1/messages \
  -d '{"model":"claude-sonnet-4-5-20250514","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'
```

Common causes:
- Key was revoked on the provider's dashboard
- Key has usage limits or billing issues
- Key was copy-pasted with trailing whitespace
- Using the wrong key format (Anthropic keys start with `sk-ant-`, OpenAI with `sk-proj-` or `sk-`)

### Rate Limited by Provider

**Symptom**: Error 429 or "rate limit exceeded" messages.

Immediate fixes:
- Wait and retry (Homun does this automatically with exponential backoff)
- Switch to a different provider temporarily
- Configure a fallback chain:
  ```toml
  [providers]
  default = "anthropic/claude-sonnet-4-5-20250514"
  fallback = ["openai/gpt-4o", "ollama/llama3"]
  ```

Long-term fixes:
- Upgrade your API plan
- Use cheaper models (Haiku, GPT-4o-mini) for cron jobs and automations
- Reduce the number of concurrent automations

### Wrong Model Used

**Symptom**: The agent says it is a different model than expected.

Check the configured default:
```bash
homun config get providers.default
```

The model string must include the provider prefix:
- Correct: `anthropic/claude-sonnet-4-5-20250514`
- Wrong: `claude-sonnet-4-5-20250514` (missing prefix)

### Context Too Long

**Symptom**: Error mentioning "context length exceeded" or "too many tokens".

Fix: Clear the current session to reset context:
- In Web UI: start a new chat session
- In CLI: exit and restart `homun chat`

If the problem persists, check:
- Large files attached to the conversation
- Very long system prompts from many active skills
- Knowledge base injection adding too much context

### Ollama Not Responding

**Symptom**: Errors when using `ollama/` models.

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve

# Verify the model is pulled
ollama list

# Test the model directly
ollama run llama3 "hello"
```

If Ollama is on a different host:
```bash
# Test the remote connection
curl http://192.168.1.100:11434/api/tags
```

Check that the `base_url` in config matches:
```bash
homun config get providers.ollama.base_url
```

## Web UI Issues

### Cannot Access the Web UI

**Symptom**: Browser shows "connection refused" or timeout.

1. **Check the gateway is running**: `homun status`
2. **Check the port**:
   ```bash
   homun config get channels.web.port
   ```
3. **Check the URL**: Make sure you are using `https://` (not `http://`). Homun serves HTTPS only.
4. **HTTPS certificate warning**: Self-signed certs trigger browser warnings. Click "Advanced" > "Proceed" to continue.
5. **Firewall**: Check that port 18443 is not blocked:
   ```bash
   # macOS
   sudo pfctl -s rules | grep 18443
   # Linux
   sudo iptables -L -n | grep 18443
   ```
6. **Binding address**: Homun binds to `127.0.0.1` by default. If accessing from another machine, you need a reverse proxy or SSH tunnel. See [Remote Access](/configuration/remote-access).

### Login Fails

**Symptom**: Correct password but login is rejected.

- **Rate limited**: After 5 failed attempts, you are locked out for 1 minute. Wait and try again.
- **Wrong username**: Usernames are case-sensitive.
- **2FA required**: If 2FA is enabled, you need to enter the TOTP code after the password.
- **Clear cookies**: Stale session cookies can cause issues. Clear cookies for `localhost` and try again.
- **Device approval**: If `require_device_approval = true`, check the gateway logs for the 6-digit code.

### Chat Streaming Not Working

**Symptom**: Messages are sent but no response appears, or the response appears all at once instead of streaming.

- **WebSocket blocked**: If behind a corporate proxy, WebSocket connections may be blocked. Check the browser console (F12 > Console) for WebSocket errors.
- **Nginx timeout**: If using Nginx as reverse proxy, ensure `proxy_read_timeout` is set to at least 300s and WebSocket headers are configured. See [Remote Access > Nginx](/configuration/remote-access#nginx).
- **Browser issue**: Try a different browser. Some browser extensions (ad blockers, privacy extensions) can interfere with WebSocket connections.

### Web UI Shows Stale Data

**Symptom**: Changes made via CLI or API do not appear in the Web UI.

Refresh the page. The Web UI fetches data on page load and does not auto-refresh all sections. For real-time updates, the chat page uses WebSocket, but other pages require a manual refresh.

## Browser Automation Issues

### Playwright Not Found

**Symptom**: Browser tool returns "playwright not found" or "npx not found".

```bash
# Check Node.js is installed
node --version
npx --version
```

If Node.js is not installed, install it from [nodejs.org](https://nodejs.org). Homun requires Node.js 18+.

If Node.js is installed but Playwright is not working:
```bash
# Manually test Playwright MCP
npx @playwright/mcp@latest --help
```

### Browser Cannot Load Pages

**Symptom**: The browser tool navigates but pages show errors or are blank.

- **Headless mode issues**: Some websites block headless browsers. Try with `headless = false`:
  ```toml
  [browser]
  enabled = true
  headless = false
  ```
- **Anti-bot detection**: Homun includes stealth injection, but sophisticated anti-bot systems may still detect it. This is a known limitation.
- **Network issues**: The browser process needs internet access. Check if your firewall blocks outbound connections from the browser.

### Browser Takes Too Long

**Symptom**: Browser operations timeout.

- Complex pages with many elements take longer to snapshot
- The `wait_for_stable_snapshot` logic waits for the page to stop changing, which can be slow on dynamic pages
- Try reducing the page complexity by navigating to specific subpages instead of the homepage

## Performance Issues

### High Memory Usage

**Symptom**: Homun process uses more memory than expected.

| Component | Typical Memory | Notes |
|-----------|:-------:|-------|
| Base process | 30-50 MB | Core runtime |
| Embedding model (fastembed) | 100-300 MB | Loaded once if knowledge base is used |
| Per chat session | 1-5 MB | Depends on conversation length |
| Knowledge base index | 50-200 MB | Depends on document count |
| Browser (Playwright) | 200-500 MB | Per browser session |

To reduce memory:
- Close unused chat sessions from the Web UI
- Use fewer knowledge base documents
- Use `openai` embedding provider instead of `fastembed` (offloads to API)
- Restart the gateway periodically to clear accumulated session data

### Slow Responses

**Symptom**: Responses take 30+ seconds.

Check each stage:
1. **LLM response time**: Test with `homun chat -m "hello"` -- if this is slow, the bottleneck is the LLM provider.
2. **Network latency**: Run `ping api.anthropic.com` (or your provider's domain) to check network conditions.
3. **Complex tool chains**: If the agent uses 5+ tools in sequence, each tool adds latency. This is normal for complex tasks.
4. **Large context**: Very long conversations slow down the LLM. Start a new session for unrelated questions.
5. **Ollama performance**: Local models on CPU are 5-20x slower than GPU. Ensure your GPU is being used:
   ```bash
   ollama ps  # Shows running models and their GPU usage
   ```

## Log Locations and Reading

### Where Logs Are

| Location | Content |
|----------|---------|
| Terminal (stdout) | Real-time gateway logs |
| `~/.homun/logs/homun.log` | File logs (when file logging is enabled) |
| Web UI > Logs | SSE stream of real-time logs |
| `/api/v1/logs/stream` | API endpoint for log streaming |

### Log Levels

```bash
# Error only (production)
RUST_LOG=error homun gateway

# Warnings and errors
RUST_LOG=warn homun gateway

# Normal operation (default)
RUST_LOG=info homun gateway

# Detailed debugging
RUST_LOG=debug homun gateway

# Everything (very verbose)
RUST_LOG=trace homun gateway

# Per-module filtering
RUST_LOG=homun=debug,sqlx=warn,reqwest=warn homun gateway
```

### Reading Log Output

Log entries follow this format:
```
2025-01-15T10:30:00.123Z  INFO homun::agent::agent_loop: Processing message session_id=abc123
2025-01-15T10:30:01.456Z DEBUG homun::provider::anthropic: Sending request model="claude-sonnet-4-5-20250514" tokens=1234
2025-01-15T10:30:02.789Z  WARN homun::security: Exfiltration guard triggered pattern="api_key"
```

Key fields:
- **Timestamp**: When the event happened
- **Level**: ERROR, WARN, INFO, DEBUG, TRACE
- **Module**: Where in the code it happened (e.g., `homun::agent::agent_loop`)
- **Message**: What happened
- **Fields**: Structured key-value data (e.g., `session_id=abc123`)

### Common Log Patterns to Watch For

| Log Pattern | Meaning | Action |
|-------------|---------|--------|
| `Provider marked unhealthy` | Circuit breaker tripped | Check provider status, failover will engage |
| `Rate limit exceeded` | Too many requests | Wait, reduce request rate, or switch provider |
| `Pairing challenge` | Unknown sender on channel | Expected for new users; provide OTP |
| `Exfiltration guard triggered` | Sensitive data detected | Data was redacted; review what leaked |
| `Vault leak detected` | Vault secret in output | Secret was redacted; check tool output |
| `Migration applied` | Database updated | Normal on first run after upgrade |
| `Circuit breaker recovery` | Provider back online | Normal; failover is disengaged |

## Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `providers.default is required` | No default model set | `homun config set providers.default "anthropic/..."` |
| `invalid model format` | Missing `/` in model string | Use format `provider/model-name` |
| `Address already in use` | Port 18443 is taken | Stop the other process or change the port |
| `invalid API key` | Wrong or revoked key | Check key on provider dashboard |
| `context_length_exceeded` | Conversation too long | Start a new session |
| `connection refused` | Ollama not running | Run `ollama serve` |
| `certificate error` | TLS issues with reverse proxy | Check proxy config; add `tls_insecure_skip_verify` |
| `CSRF token mismatch` | Stale web session | Clear cookies and log in again |
| `rate limit exceeded` | Too many requests | Wait for `Retry-After` seconds |

## Getting Help

### Filing a Bug Report

When reporting a bug, include:

1. **Homun version**: `homun --version`
2. **Operating system**: macOS, Linux (distro), Windows
3. **Steps to reproduce**: What you did, what you expected, what happened
4. **Error message**: The exact error from the logs
5. **Configuration** (redact secrets): `homun config show`
6. **Log output**: Relevant lines from `RUST_LOG=debug homun gateway`

### Where to Get Help

- **GitHub Issues**: Report bugs and feature requests at the project repository
- **Documentation**: This site covers all features and configuration options
- **Logs**: Most problems are diagnosable from the debug logs

### Quick Self-Help Checklist

Before filing an issue, check:
- [ ] Is the gateway running? (`homun status`)
- [ ] Is the config valid? (`homun config show`)
- [ ] Is the API key valid? (test on provider's website)
- [ ] Are the logs showing errors? (`RUST_LOG=debug homun gateway`)
- [ ] Did you try restarting? (`Ctrl+C` then `homun gateway`)
- [ ] Is this a known issue? (check GitHub Issues)
