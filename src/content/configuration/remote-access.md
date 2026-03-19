# Remote Access

Homun runs on `localhost:18443` by default. To access it from other devices, use one of these approaches.

## SSH Tunnel (Simplest)

Forward the port over SSH with no configuration changes:

```bash
ssh -L 18443:localhost:18443 user@your-server
```

Then open `https://localhost:18443` in your local browser. The connection is encrypted by SSH.

Best for: quick access from a single machine. Requires SSH access and the tunnel must stay open.

## Tailscale (Recommended)

If you use [Tailscale](https://tailscale.com), expose Homun to your private network:

```bash
tailscale serve https / http://localhost:18443
```

Access via `https://your-machine.tail-net-name.ts.net`. Tailscale handles TLS certificates and network-level authentication.

Best for: secure access across all your devices. End-to-end encrypted, no ports exposed to the public internet.

## Reverse Proxy

For public-facing setups, place a reverse proxy in front of Homun with a real domain and TLS certificate.

### Caddy

```
homun.example.com {
    reverse_proxy localhost:18443 {
        transport http {
            tls_insecure_skip_verify
        }
    }
}
```

### Nginx

```nginx
server {
    listen 443 ssl;
    server_name homun.example.com;

    ssl_certificate /etc/letsencrypt/live/homun.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/homun.example.com/privkey.pem;

    location / {
        proxy_pass https://127.0.0.1:18443;
        proxy_ssl_verify off;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

When using a reverse proxy, enable X-Forwarded-For so rate limiting uses the real client IP:

```toml
[channels.web]
trust_x_forwarded_for = true
```

## Security Hardening for Remote Access

When exposing Homun remotely, tighten these settings:

```toml
[channels.web]
host = "127.0.0.1"
port = 18443
trust_x_forwarded_for = true
session_ttl_secs = 3600
require_device_approval = true
auth_rate_limit_per_minute = 3
```

| Setting | What It Does |
|---------|-------------|
| `require_device_approval` | New browsers must enter a 6-digit approval code |
| `session_ttl_secs` | Shorten session lifetime (default: 24h) |
| `trust_x_forwarded_for` | Use real IP behind a proxy for rate limits |
| `auth_rate_limit_per_minute` | Reduce login attempts allowed per minute |

## Device Approval

When `require_device_approval = true`, logging in from a new browser triggers an approval flow:

1. User enters correct credentials from an unrecognized browser
2. Homun shows a 6-digit code (also logged to the server console)
3. User enters the code on the login page, or approves from an existing session via **Settings > Devices**
4. The device is marked as trusted -- future logins from the same browser succeed immediately

Manage devices through the Web UI or API:

```bash
# List trusted devices
curl https://localhost:18443/api/v1/devices

# Revoke a device
curl -X DELETE https://localhost:18443/api/v1/devices/{id}
```
