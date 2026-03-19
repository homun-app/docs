# Security

Homun includes multiple layers of security to protect your data and control access.

## Web Authentication

The Web UI uses password-based authentication with strong defaults:

- **PBKDF2** hashing with 600,000 iterations
- **HMAC-signed** session cookies
- **CSRF** protection on all state-changing requests

Create your admin account during the setup wizard or via CLI:

```bash
homun config
```

## API Keys

Generate API keys to access Homun programmatically. Keys use the `wh_` prefix and support scoped permissions:

| Scope | Access |
|-------|--------|
| `admin` | Full control |
| `chat` | Send and receive messages |
| `read` | Query-only access |

Create API keys from the Web UI under **Account > API Keys**, then use them as bearer tokens:

```bash
curl -H "Authorization: Bearer wh_your_token_here" \
  https://localhost:18443/api/v1/health
```

## Rate Limiting

Built-in rate limits protect against brute force and abuse:

| Endpoint | Default Limit |
|----------|--------------|
| Authentication | 5 requests/min per IP |
| API calls | 60 requests/min per IP |

Customize in your config:

```toml
[channels.web]
auth_rate_limit_per_minute = 3
api_rate_limit_per_minute = 30
```

## HTTPS / TLS

Homun serves HTTPS by default with a self-signed certificate. For production use with a real domain, set up a reverse proxy (see [Remote Access](/configuration/remote-access)).

## Encrypted Vault

The vault stores secrets encrypted with AES-256-GCM. The master key is stored in your OS keychain (macOS Keychain, Linux Secret Service, or Windows Credential Manager).

```bash
# Store a secret
homun vault set MY_API_KEY "sk-secret-value"

# Retrieve a secret
homun vault get MY_API_KEY

# List stored secrets
homun vault list

# Remove a secret
homun vault remove MY_API_KEY
```

Skills and automations can reference vault secrets by name without exposing the actual values.

## Two-Factor Authentication (TOTP)

Enable 2FA for an extra layer of security on web login:

1. Go to **Account > Security** in the Web UI
2. Click **Enable 2FA**
3. Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
4. Enter the 6-digit code to confirm

Once enabled, every login requires both your password and a TOTP code.

## Emergency Stop (E-Stop)

The emergency stop instantly halts all running operations:

- Stops the agent loop
- Terminates browser automation
- Disconnects MCP servers
- Cancels in-flight tool executions

Trigger via the Web UI (red button in the dashboard) or the API:

```bash
curl -X POST https://localhost:18443/api/v1/estop \
  -H "Authorization: Bearer wh_your_token"
```

## Exfiltration Guard

Homun scans tool results for sensitive data patterns (API keys, passwords, tokens) and redacts them before they reach the LLM. This prevents accidental data leaks through model responses.
