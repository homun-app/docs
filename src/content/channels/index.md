# Channels

Channels are the messaging integrations that connect Homun to your communication tools. You can talk to Homun through Telegram, WhatsApp, Discord, Slack, Email, the built-in Web UI, or the command-line. All channels run concurrently within a single `homun gateway` process — enable as many as you need.

## How Channels Work

Every channel follows the same internal architecture:

```
User message
    |
    v
Channel (Telegram, Discord, etc.)
    |
    v
InboundMessage (unified format)
    |
    v
MessageBus (tokio mpsc)
    |
    v
Gateway (auth, routing, session lookup)
    |
    v
AgentLoop (LLM reasoning, tool calls)
    |
    v
OutboundMessage
    |
    v
Channel (delivers response)
```

1. A message arrives on the platform (e.g., a Telegram message, a Slack DM, an email)
2. The channel implementation converts it into an internal **InboundMessage** with a unified format: `channel`, `sender_id`, `chat_id`, `content`, `timestamp`, and optional `metadata` (attachments, thread IDs, email subjects)
3. The **MessageBus** routes the message to the gateway
4. The **Gateway** handles authentication (pairing verification, allow-lists), resolves the session, and determines the channel behavior (persona, response mode, tone of voice)
5. The **AgentLoop** processes the message — reasoning, calling tools, generating a response
6. The response is wrapped in an **OutboundMessage** and sent back through the originating channel

This architecture means Homun behaves consistently across all channels: same tools, same memory, same personality. A conversation started on Telegram can be referenced from the Web UI because they share the same underlying memory and knowledge base.

## Channel Selection Guide

Choosing the right channel depends on your use case:

**For personal daily use**: Telegram or WhatsApp. Both work on mobile and desktop, support media, and feel like chatting with a contact. Telegram is easier to set up (just a bot token), while WhatsApp integrates with your existing phone number.

**For team environments**: Slack or Discord. Both support channels/servers, mention-based activation, and thread replies. Slack is better for workplaces (Socket Mode means no public URL needed), Discord is better for communities.

**For async workflows**: Email. Homun monitors your inbox, processes incoming emails, and can draft or send replies. Supports multiple accounts with different response modes (assisted, automatic, on-demand).

**For development and scripting**: CLI. No gateway needed, works locally, and supports piping for shell automation.

**For full control**: Web UI. Always available when the gateway runs, with multi-session chat, tool timeline, file upload, and access to all Homun management pages.

## Feature Comparison

| Feature | Telegram | WhatsApp | Discord | Slack | Email | Web UI | CLI |
|---|---|---|---|---|---|---|---|
| Text messages | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Images / photos | Yes | Yes | Yes | Yes | Yes | Yes | No |
| File attachments | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Voice / audio | Yes | Yes | No | No | Yes | No | No |
| Video | No | Yes | No | No | No | No | No |
| Typing indicator | Yes | Yes | Yes | No | No | No | No |
| Group / channel support | Yes | Yes | Yes | Yes | No | No | No |
| Thread replies | No | No | Yes | Yes | Yes | No | No |
| Streaming responses | No | No | No | No | No | Yes | Yes |
| Proactive messaging | Yes | Yes | Yes | Yes | Yes | No | No |
| Mobile app | Yes | Yes | Yes | Yes | Yes | Yes* | No |
| No gateway needed | No | No | No | No | No | No | Yes |
| Multi-session | No | No | No | No | Yes** | Yes | No |

*Web UI is responsive and works on mobile browsers.
**Email supports multiple accounts, each acting as a separate session.

## Shared Channel Configuration

All channels that run through the gateway share a set of common configuration options. These control how the agent behaves on each channel independently.

### Persona

The `persona` option controls how the agent introduces and presents itself:

| Persona | Behavior |
|---|---|
| `bot` (default) | Presents as an AI assistant |
| `owner` | Speaks as if it were you (first person) |
| `company` | Represents a business or brand |
| `custom` | Uses a custom identity you define |

### Response Mode

The `response_mode` option controls how the agent handles messages:

| Mode | Behavior |
|---|---|
| `automatic` (default) | Responds immediately to every message |
| `assisted` | Drafts a response and sends it to your notify channel for approval |
| `on_demand` | Only processes messages containing a trigger word |
| `silent` | Receives messages but does not respond |

### Tone of Voice

The `tone_of_voice` option sets the default communication style for the channel. For example: `"professional and concise"` or `"friendly and casual"`. This can be overridden per-contact.

### Notify Channel

When using `assisted` or `on_demand` response modes, `notify_channel` and `notify_chat_id` specify where draft notifications are sent (e.g., to your Telegram or Web UI for review).

## Enabling a Channel

1. Add the channel configuration to `~/.homun/config.toml`
2. Start (or restart) the gateway:

```bash
homun gateway
```

You can enable multiple channels simultaneously. They all run concurrently within the single gateway process, sharing the same agent loop, memory, and tools.

To verify which channels are active, check the gateway startup logs:

```
INFO Telegram channel (Frankenstein) starting
INFO WhatsApp channel starting session
INFO Discord bot connected
INFO Slack starting in Socket Mode (real-time)
INFO Email IDLE listening (instant push enabled)
INFO Web server listening on https://127.0.0.1:18443
```

## Security

Every channel enforces authentication before accepting messages:

- **Pairing channels** (Telegram, WhatsApp, Discord, Slack): when `pairing_required = true`, unknown senders receive a one-time 6-digit code. They must send it back to verify their identity. Once paired, they are remembered permanently.
- **Allow-list channels**: the `allow_from` field restricts which users can interact. Supports user IDs, phone numbers, email addresses, or domain patterns depending on the channel.
- **Web UI**: uses password authentication with PBKDF2 hashing (600k iterations), HMAC-signed session cookies, and rate limiting (5 login attempts per minute per IP).
- **CLI**: local-only, no authentication required (the user is already on the machine).
- **Gateway auth**: all channel authentication is centralized in the gateway (`agent/auth.rs`). Channels are transport-only — they forward messages and let the gateway decide whether to accept them.

## Supported Channels

| Channel | Transport | Auth Method | Setup Difficulty |
|---|---|---|---|
| [Telegram](/channels/telegram) | Long polling | Allow-list + OTP pairing | Easy |
| [WhatsApp](/channels/whatsapp) | WebSocket (wa-rs) | QR code pairing | Medium |
| [Discord](/channels/discord) | Gateway WebSocket | Allow-list + OTP pairing | Medium |
| [Slack](/channels/slack) | Socket Mode / HTTP polling | Allow-list + OTP pairing | Medium |
| [Email](/channels/email) | IMAP IDLE + SMTP | Allow-list by sender | Medium |
| [Web UI](/channels/web) | HTTPS + WebSocket | Password login | None (built-in) |
| [CLI](/channels/cli) | stdin/stdout | Local only | None |
