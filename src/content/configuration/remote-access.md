# Remote Access

Homun runs on `localhost:18443` by default and is not accessible from other devices. This page covers every method to access Homun remotely, from the simplest (SSH tunnel) to production-grade (reverse proxy with TLS), along with security hardening for each approach.

## Quick Comparison

| Method | Setup Effort | Security | Best For |
|--------|:------------:|:--------:|----------|
| SSH Tunnel | Minimal | High | Quick access from one machine |
| Tailscale | Low | Very High | Access from all your devices |
| Cloudflare Tunnel | Low | High | Public access without port forwarding |
| Reverse Proxy | Medium | High | Production, custom domain, multi-user |
| Direct Binding | Minimal | Low | LAN-only testing (not recommended) |

## SSH Tunnel (Simplest)

Forward the port over SSH with no configuration changes to Homun:

```bash
ssh -L 18443:localhost:18443 user@your-server
```

Then open `https://localhost:18443` in your local browser. The connection is encrypted by SSH. Homun sees all requests as coming from `127.0.0.1`, so no special configuration is needed.

**Keep the tunnel alive**: If the tunnel drops on idle, use `ServerAliveInterval`:

```bash
ssh -L 18443:localhost:18443 -o ServerAliveInterval=60 user@your-server
```

**Background tunnel**: Run it as a background process:

```bash
ssh -f -N -L 18443:localhost:18443 user@your-server
```

**Persistent tunnel with autossh**: For a tunnel that automatically reconnects:

```bash
# Install autossh (macOS: brew install autossh, Ubuntu: apt install autossh)
autossh -M 0 -f -N -L 18443:localhost:18443 \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  user@your-server
```

**Multiple devices**: Each device needs its own SSH tunnel. For access from phones or tablets, use Tailscale instead.

Best for: quick access from a single laptop or workstation. Requires SSH access and the tunnel must stay open.

## Tailscale (Recommended)

[Tailscale](https://tailscale.com) creates a private network between your devices. Once set up, every device on your tailnet can access Homun without port forwarding, firewall changes, or certificates.

### Setup

1. Install Tailscale on both the server running Homun and your accessing device
2. Expose Homun through Tailscale Serve:

```bash
tailscale serve https / http://localhost:18443
```

3. Access via `https://your-machine.your-tailnet.ts.net`

Tailscale handles TLS certificates automatically through Let's Encrypt. No browser warnings, no self-signed certificates.

### Why Tailscale Is Recommended

- **Zero configuration on Homun**: No config changes needed; Homun stays on localhost
- **End-to-end encryption**: WireGuard-based, encrypted between your devices
- **Automatic TLS**: Valid certificates, no browser warnings
- **Works on mobile**: Install the Tailscale app on iOS/Android
- **No ports exposed**: Nothing open to the public internet
- **Free tier**: Generous for personal use (up to 100 devices)

### Tailscale Funnel (Public Access)

If you want to share Homun with someone outside your tailnet:

```bash
tailscale funnel 18443
```

This creates a public URL that routes through Tailscale's network. The connection is encrypted end-to-end. Disable it when no longer needed.

### Tailscale + Homun Config

No Homun config changes are needed for Tailscale. However, for better logging, you can enable `trust_x_forwarded_for`:

```toml
[channels.web]
trust_x_forwarded_for = true
```

Best for: secure access across all your devices (laptops, phones, tablets). End-to-end encrypted, no ports exposed to the public internet, automatic TLS.

## Cloudflare Tunnel

Cloudflare Tunnel (formerly Argo Tunnel) exposes Homun through Cloudflare's network without opening any inbound ports.

### Setup

1. Install `cloudflared`: [developers.cloudflare.com/cloudflare-one](https://developers.cloudflare.com/cloudflare-one/)
2. Create a tunnel:

```bash
cloudflared tunnel create homun
cloudflared tunnel route dns homun homun.example.com
```

3. Configure the tunnel (`~/.cloudflared/config.yml`):

```yaml
tunnel: homun
credentials-file: /path/to/credentials.json

ingress:
  - hostname: homun.example.com
    service: https://localhost:18443
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

4. Start the tunnel:

```bash
cloudflared tunnel run homun
```

### Running as a Service

To keep the tunnel running after logout:

```bash
# Install as system service (Linux)
sudo cloudflared service install

# Or on macOS
sudo cloudflared service install
```

### Cloudflare Access Integration

For additional authentication, pair the tunnel with Cloudflare Access to require a second identity verification (email OTP, SSO, etc.) before users can even reach Homun's login page.

Best for: public access without port forwarding, paired with Cloudflare Access for additional authentication layers. Requires a Cloudflare account and domain.

## Reverse Proxy

For production deployments with a custom domain and real TLS certificate, use a reverse proxy. All proxy configurations below handle WebSocket connections (required for chat) and set appropriate timeouts for LLM requests.

### Caddy (Automatic TLS)

Caddy automatically obtains and renews Let's Encrypt certificates:

```
homun.example.com {
    reverse_proxy localhost:18443 {
        transport http {
            tls_insecure_skip_verify
        }
    }
}
```

The `tls_insecure_skip_verify` is needed because Homun uses a self-signed certificate on its end. Caddy handles the public-facing TLS.

Caddy handles WebSocket upgrade automatically. No additional configuration is needed for chat streaming.

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name homun.example.com;

    ssl_certificate /etc/letsencrypt/live/homun.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/homun.example.com/privkey.pem;

    # WebSocket support (required for chat)
    location / {
        proxy_pass https://127.0.0.1:18443;
        proxy_ssl_verify off;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts for long-running LLM requests
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name homun.example.com;
    return 301 https://$server_name$request_uri;
}
```

**Important Nginx notes**:
- The `proxy_read_timeout 300s` is critical. LLM responses can take 30+ seconds for complex queries. The default 60s timeout will cause errors.
- WebSocket headers (`Upgrade`, `Connection`) are required for the chat interface to work.
- `proxy_ssl_verify off` is needed because Homun uses a self-signed cert internally.
- The `proxy_set_header X-Forwarded-For` line is needed for per-IP rate limiting to work correctly.

### Obtaining TLS Certificates with Certbot

If you use Nginx, get free TLS certificates from Let's Encrypt:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain and install certificate
sudo certbot --nginx -d homun.example.com

# Auto-renewal is set up automatically by certbot
```

### Traefik

```yaml
# docker-compose.yml or traefik dynamic config
http:
  routers:
    homun:
      rule: "Host(`homun.example.com`)"
      service: homun
      tls:
        certResolver: letsencrypt

  services:
    homun:
      loadBalancer:
        servers:
          - url: "https://127.0.0.1:18443"
        serversTransport: insecureTransport

  serversTransports:
    insecureTransport:
      insecureSkipVerify: true
```

### Enabling X-Forwarded-For

When Homun is behind a reverse proxy, enable `trust_x_forwarded_for` so rate limiting, session binding, and logging use the real client IP instead of the proxy's IP:

```toml
[channels.web]
trust_x_forwarded_for = true
```

**Only enable this when behind a trusted proxy.** If Homun is directly exposed, clients can forge this header to bypass rate limits.

## Docker Deployment

When running Homun in Docker, mount the data directory and expose the port:

```bash
docker run -d \
  --name homun \
  -v ~/.homun:/data \
  -p 18443:18443 \
  homun/homun:latest gateway
```

### Docker with Caddy Sidecar

For automatic TLS in Docker, run Caddy as a sidecar:

```yaml
# docker-compose.yml
services:
  homun:
    image: homun/homun:latest
    command: gateway
    volumes:
      - homun-data:/data
    networks:
      - internal

  caddy:
    image: caddy:latest
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
    networks:
      - internal

volumes:
  homun-data:
  caddy-data:

networks:
  internal:
```

With the same Caddyfile as above, replacing `localhost` with the Docker service name:

```
homun.example.com {
    reverse_proxy homun:18443 {
        transport http {
            tls_insecure_skip_verify
        }
    }
}
```

## Security Hardening for Remote Access

When exposing Homun remotely, tighten these settings regardless of which method you use:

```toml
[channels.web]
host = "127.0.0.1"
port = 18443
trust_x_forwarded_for = true
session_ttl_secs = 3600
require_device_approval = true
auth_rate_limit_per_minute = 3
```

| Setting | Default | Recommended | What It Does |
|---------|---------|-------------|-------------|
| `require_device_approval` | `false` | `true` | New browsers must enter a 6-digit approval code |
| `session_ttl_secs` | `86400` (24h) | `3600` (1h) | Shorter sessions reduce risk of stolen cookies |
| `trust_x_forwarded_for` | `false` | `true` (behind proxy) | Use real IP for rate limits and logs |
| `auth_rate_limit_per_minute` | `5` | `3` | Fewer login attempts allowed per minute |

### Enable 2FA

For remote access, two-factor authentication is strongly recommended. See [Security > Two-Factor Authentication](/configuration/security#two-factor-authentication-totp).

## Device Approval

When `require_device_approval = true`, logging in from a new (unrecognized) browser triggers an approval flow:

1. User enters correct username and password from an unrecognized browser
2. Homun displays a 6-digit approval code on the login page
3. The same code is logged to the server console and sent to configured notification channels
4. The user enters the code on the login page, or an admin approves from an existing session via **Account > Devices**
5. The browser is marked as trusted -- future logins from the same browser succeed immediately without the approval step

Trusted devices are identified by a browser fingerprint stored in a cookie. Clearing cookies will require re-approval.

### Managing Devices

Through the Web UI: go to **Account > Devices** to see all trusted devices, their last access time, and IP address. Click **Revoke** to remove trust.

Through the API:

```bash
# List all trusted devices
curl -H "Authorization: Bearer wh_your_token" \
  https://localhost:18443/api/v1/devices

# Approve a pending device
curl -X POST -H "Authorization: Bearer wh_your_token" \
  https://localhost:18443/api/v1/devices/{id}/approve

# Revoke a trusted device
curl -X DELETE -H "Authorization: Bearer wh_your_token" \
  https://localhost:18443/api/v1/devices/{id}
```

## Firewall Considerations

If your server runs a firewall, you only need to open the ports used by your chosen remote access method:

| Method | Ports to Open |
|--------|---------------|
| SSH Tunnel | 22 (SSH only) |
| Tailscale | None (outbound-only) |
| Cloudflare Tunnel | None (outbound-only) |
| Reverse Proxy | 80, 443 (HTTP/HTTPS) |
| Direct Binding | 18443 (not recommended) |

Tailscale and Cloudflare Tunnel both work through outbound connections, so no inbound ports need to be opened on your firewall. This is a significant security advantage.

## Mobile Access

All remote access methods work from mobile browsers. The Web UI is fully responsive and works on:
- iOS Safari (iPhone, iPad)
- Android Chrome
- Any modern mobile browser

For the best mobile experience, use Tailscale -- install the Tailscale app on your phone and access Homun via your tailnet URL. No VPN configuration needed, the app handles everything.

### Progressive Web App

The Homun Web UI can be installed as a PWA (Progressive Web App) on mobile devices. In your mobile browser, use "Add to Home Screen" to create an app-like shortcut that opens without browser chrome.

## Port Forwarding (Not Recommended)

For completeness, you can expose Homun directly by changing the bind address:

```toml
[channels.web]
host = "0.0.0.0"    # Binds to all interfaces
port = 18443
```

Then configure port forwarding on your router to direct external traffic to port 18443 on your server.

**This is not recommended** because:
- Homun's self-signed TLS certificate will trigger browser warnings
- Your server is directly exposed to the internet
- No additional security layer between the internet and Homun
- Rate limiting is the only protection against brute-force attacks

If you must use port forwarding, apply all security hardening settings and enable 2FA.
