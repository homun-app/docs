# Channels

Channels are the messaging integrations that connect Homun to your communication tools. You can talk to Homun through Telegram, WhatsApp, Discord, Slack, Email, the built-in Web UI, or the command-line.

## How Channels Work

Every channel follows the same flow:

1. A message arrives from the channel (e.g., a Telegram message)
2. The channel converts it into an internal `InboundMessage`
3. The message bus routes it to the agent loop
4. The agent processes the message, calls tools if needed, and produces a response
5. The response is sent back through the originating channel

This means Homun behaves consistently across all channels -- same tools, same memory, same personality.

## Supported Channels

| Channel | Transport | Auth Method |
|---|---|---|
| [Telegram](/channels/telegram) | Long polling | DM pairing (OTP) |
| [WhatsApp](/channels/whatsapp) | WebSocket (wa-rs) | QR code pairing |
| [Discord](/channels/discord) | Gateway WebSocket | Bot token |
| [Slack](/channels/slack) | Socket Mode | Bot + App tokens |
| [Email](/channels/email) | IMAP + SMTP | Email credentials |
| [Web UI](/channels/web) | WebSocket | Password login |
| [CLI](/channels/cli) | stdin/stdout | Local only |

## Enabling a Channel

1. Add the channel configuration to `~/.homun/config.toml`
2. Restart the gateway

```bash
homun gateway
```

You can enable multiple channels at the same time. They all run concurrently within the single `homun gateway` process.

## Security

- Every channel requires authentication before accepting messages
- DM pairing channels (Telegram, WhatsApp) use a one-time code verification
- Bot-based channels (Discord, Slack) use allow-lists for users/guilds/channels
- The Web UI uses password authentication with rate limiting
- The CLI is local-only and requires no authentication
