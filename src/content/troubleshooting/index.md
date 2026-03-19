# Common Issues

## Gateway Won't Start

**Symptom**: `homun gateway` exits immediately or shows an error.

- **Check your config**: Run `homun config` to verify settings are valid. A missing or malformed `config.toml` is the most common cause.
- **Port already in use**: If port 18443 is occupied, either stop the other process or change the port:
  ```toml
  [channels.web]
  port = 18444
  ```
- **Check logs**: Run with verbose logging for details:
  ```bash
  RUST_LOG=debug homun gateway
  ```

## Channel Not Responding

**Symptom**: Messages sent via Telegram, Discord, etc. are not reaching Homun.

- **Verify the token**: Make sure the channel token in your config is correct and not expired.
- **Check channel config**: Each channel needs its specific configuration section. Run `homun config get channels` to review.
- **Restart the gateway**: Some channel changes require a restart.
- **Pairing required**: If pairing is enabled, new senders must complete the OTP verification first.

## LLM Returns Errors

**Symptom**: Homun responds with an error instead of a normal answer.

- **Verify your API key**: Check that the key is valid and has not been revoked.
  ```bash
  homun config get providers.anthropic.api_key
  ```
- **Check provider status**: The LLM provider may be experiencing downtime. Check their status page.
- **Try a fallback model**: Configure fallback providers so Homun can switch automatically:
  ```toml
  [providers]
  fallback = ["openai/gpt-4o", "ollama/llama3"]
  ```
- **Ollama not running**: If using Ollama, make sure the service is started:
  ```bash
  ollama serve
  ```

## Web UI Not Accessible

**Symptom**: Browser shows connection refused or timeout when accessing the Web UI.

- **Check the port**: Confirm the gateway is running and listening:
  ```bash
  homun status
  ```
- **Firewall**: Make sure your firewall allows connections to port 18443.
- **HTTPS certificate**: If using a self-signed certificate, your browser may block the connection. Accept the certificate warning or set up a proper TLS certificate via a [reverse proxy](/configuration/remote-access).
- **Binding address**: By default Homun binds to `127.0.0.1` (localhost only). For remote access, use a reverse proxy or SSH tunnel instead of changing the bind address.

## High Memory Usage

**Symptom**: Homun process uses more memory than expected.

- **Large knowledge base**: Many ingested documents increase memory usage. Check your knowledge base size in the Web UI under **Knowledge**.
- **Active sessions**: Each chat session keeps messages in memory. Close unused sessions.
- **Embedding model**: If using local embeddings (fastembed), the model is loaded in memory. This is normal and typically uses 100-300 MB.

## Browser Automation Fails

**Symptom**: Browser tool returns errors or does not work.

- **Playwright not installed**: Homun needs Node.js and installs Playwright MCP automatically. Verify Node.js is available:
  ```bash
  node --version
  npx --version
  ```
- **Browser not enabled**: Check your config:
  ```toml
  [browser]
  enabled = true
  ```
- **Headless issues**: Some websites behave differently in headless mode. Try with `headless = false` to debug.
- **Docker environment**: If running in Docker, the browser may need additional dependencies. Use the Docker image which includes them.

## Getting Help

- **Logs**: Check `~/.homun/logs/` for detailed log files.
- **Debug mode**: Run with `RUST_LOG=debug` for verbose output.
- **GitHub Issues**: Report bugs at the project's GitHub repository.
