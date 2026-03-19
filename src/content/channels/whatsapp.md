# WhatsApp

Connect Homun to WhatsApp using a native Rust integration. No external bridge, no Node.js, no third-party API service. Homun connects directly to WhatsApp Web using the [wa-rs](https://github.com/nickelc/wa-rs) library, a pure Rust implementation of the WhatsApp Web protocol.

This means Homun appears as a linked device on your WhatsApp account — just like WhatsApp Web or WhatsApp Desktop.

## Quick Setup

1. Enable WhatsApp in `~/.homun/config.toml`
2. Run `homun gateway`
3. Open the Web UI and go to Channels > WhatsApp
4. Click **Pair** and scan the QR code with your phone
5. Start messaging — Homun responds to incoming messages on your WhatsApp number

## How It Works

Homun uses the WhatsApp Web multi-device protocol. When you pair via QR code, your phone registers Homun as a linked device. From that point on:

- Homun receives all incoming messages directly from WhatsApp servers (no phone relay needed)
- Session credentials are stored in a local SQLite database (`~/.homun/whatsapp.db` by default)
- The connection resumes automatically when the gateway restarts — no re-pairing needed
- A 10-second **grace period** after connection ignores queued/offline messages to prevent replying to old messages

The architecture is:

```
Homun (Rust) <-- wa-rs --> WhatsApp Web servers (direct WebSocket)
```

No intermediary process, no Node.js bridge, no external service.

## Pairing

### QR Code Pairing via Web UI

This is the recommended pairing method:

1. Start the gateway: `homun gateway`
2. Open the Web UI (default: `https://localhost:18443`)
3. Navigate to **Channels** > **WhatsApp**
4. Click **Pair** — a QR code appears on screen
5. On your phone: open WhatsApp > **Settings** > **Linked Devices** > **Link a Device**
6. Scan the QR code
7. Wait for the connection to establish (usually 5-10 seconds)
8. The Web UI shows "Connected"

### Phone Number Pairing

If you prefer not to scan a QR code, you can pair using your phone number:

```toml
[channels.whatsapp]
enabled = true
phone_number = "393331234567"  # International format, no + prefix
```

When the gateway starts, it requests a pairing code from WhatsApp. The code appears in the gateway logs. Enter it on your phone in the linked devices screen.

### Session Persistence

Once paired, the session is stored in a local SQLite database. The gateway reconnects automatically on restart without requiring a new QR scan. Sessions typically last weeks or months unless you manually unlink the device from your phone.

## Configuration Reference

```toml
[channels.whatsapp]
# Enable the WhatsApp channel (default: false)
enabled = true

# Phone number for pair-code authentication (optional)
# International format without the + prefix (e.g., "393331234567")
# If empty, QR code pairing is used instead
phone_number = ""

# Path to the WhatsApp session SQLite database (default: ~/.homun/whatsapp.db)
db_path = "~/.homun/whatsapp.db"

# Skip processing history sync from phone (default: false)
# Recommended for bots — prevents processing old message history on first connect
skip_history_sync = true

# Restrict to specific phone numbers (optional)
# International format without the + prefix
allow_from = ["393331234567"]

# Require OTP pairing for unknown senders (default: false)
pairing_required = false

# Bot display name used for @mention detection in groups (default: "homun")
bot_name = "homun"

# Response mode: automatic, assisted, on_demand, silent (default: automatic)
response_mode = "automatic"

# Persona: bot, owner, company, custom (default: bot)
persona = "bot"

# Default tone of voice for this channel
tone_of_voice = ""

# Channel to send draft notifications when in assisted mode
# notify_channel = "telegram"
# notify_chat_id = "123456789"

# Named agent to handle messages (empty = default agent)
# default_agent = ""
```

### Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | Boolean | `false` | Enable the WhatsApp channel |
| `phone_number` | String | `""` | Phone number for pair-code auth (international format, no +). Empty = QR pairing |
| `db_path` | String | `"~/.homun/whatsapp.db"` | Path to the session SQLite database |
| `skip_history_sync` | Boolean | `false` | Skip processing phone's message history on connect |
| `allow_from` | Array of strings | `[]` | Phone numbers allowed to interact (international format, no +) |
| `pairing_required` | Boolean | `false` | Require OTP verification for unknown senders |
| `bot_name` | String | `"homun"` | Name for @mention detection in groups |
| `response_mode` | String | `"automatic"` | How the agent handles messages |
| `persona` | String | `"bot"` | How the agent presents itself |
| `tone_of_voice` | String | `""` | Default communication style |
| `notify_channel` | String | (none) | Where to send drafts in assisted mode |
| `notify_chat_id` | String | (none) | Chat ID on the notify channel |

## Features

### Message Handling

When a WhatsApp message arrives:

1. The bot sends a **typing indicator** ("composing...") so the sender sees the familiar "typing..." status
2. The agent processes the message with full tool access
3. The response is sent back as a text message
4. The typing indicator is cleared ("paused")

Messages older than 120 seconds are automatically dropped to prevent replying to stale queued messages after a reconnect.

### Media Support

Homun downloads and processes media attachments:

- **Images**: downloaded as JPEG, passed to the agent as attachments (supports vision-capable models)
- **Documents**: downloaded with original filename, passed to the agent for reading/analysis
- **Audio**: downloaded as OGG, available for transcription via tools
- **Video**: downloaded as MP4, available as attachments

All media is saved to a temporary directory (`/tmp/homun_whatsapp/`) and cleaned up on restart.

### Typing Indicators

When the gateway is running, the bot shows **typing** status while processing a message and clears it after responding. This gives users a natural chat experience.

### Presence Status

On connection, Homun sets its presence to **available** (online). This means your WhatsApp contacts see the "online" indicator when the gateway is running.

### Group Chats

In group chats, the bot only responds when **@mentioned** by its `bot_name`:

```
@homun what's the weather in Rome?
```

The mention tag is stripped from the message before processing. The bot checks for mentions in three ways:

1. Formal @mention via WhatsApp's mention system (ContextInfo.mentioned_jid)
2. Text contains `@bot_name` (informal text mention)
3. Text contains the bot's phone number

If none of these match, the message is silently ignored.

### Proactive Messaging

When `phone_number` is configured, Homun can send proactive messages (e.g., from automations, cron jobs, or cross-channel routing) to your WhatsApp. Without `phone_number`, the bot can only reply to incoming messages.

### Message Splitting

Long responses are automatically split into chunks at newline boundaries. Each chunk stays under 4,000 characters.

## Re-Pairing

You need to re-pair when:

- You manually unlinked the device from your phone (WhatsApp Settings > Linked Devices > remove the device)
- Your phone was offline for more than 14 days (WhatsApp's linked device timeout)
- The session database was deleted or corrupted

When the session is invalid, the gateway logs:

```
ERROR WhatsApp logged out! Re-pair with: homun config -> WhatsApp tab
```

To re-pair:

1. Open the Web UI
2. Go to **Channels** > **WhatsApp**
3. Click **Pair** again
4. Scan the new QR code

The gateway includes an automatic reconnect loop with exponential backoff (2s, 4s, 8s, up to 120s cap). After a disconnection, it retries automatically. After a logout event, it stops and waits for re-pairing.

## Multi-Device Considerations

WhatsApp's multi-device architecture means:

- **Your phone does not need to be online** for Homun to receive messages. Messages are delivered directly from WhatsApp servers.
- **Linked devices share end-to-end encryption keys** with your phone during pairing.
- **Maximum 4 linked devices** per WhatsApp account. Homun counts as one.
- **14-day inactivity limit**: if your phone does not connect to the internet for 14 days, linked devices (including Homun) are automatically unlinked.
- **Message history**: by default, WhatsApp syncs recent message history to new linked devices. Use `skip_history_sync = true` to prevent Homun from processing old messages during initial pairing.

## Security

### Self-Message Filtering

Homun tracks outbound message IDs to distinguish bot-sent echoes from user self-messages (messages you send from your phone). Both are ignored — only messages from other people are processed.

### Grace Period

After connecting (or reconnecting), Homun ignores all messages for 10 seconds. This prevents the bot from replying to messages that were queued while it was offline.

### Message Age Check

Messages with timestamps older than 120 seconds are dropped. Messages with future timestamps (more than 60 seconds ahead) are also dropped. This prevents processing stale or malformed messages.

## Troubleshooting

### "WhatsApp not paired yet"

The session database does not exist. You need to pair the device first:

1. Start the gateway
2. Open the Web UI > Channels > WhatsApp > Pair
3. Scan the QR code with your phone

### QR code does not appear in Web UI

1. Make sure the gateway is running
2. Check that `[channels.whatsapp] enabled = true` is set
3. Check the gateway logs for errors
4. Try restarting the gateway

### "WhatsApp session failed, reconnecting after backoff"

The WebSocket connection to WhatsApp servers was lost. This can happen due to:

- Network interruptions
- WhatsApp server maintenance
- Session token expiration

The bot reconnects automatically with exponential backoff. If the error persists after several minutes, check your internet connection.

### "WhatsApp logged out"

Your device was unlinked. Possible causes:

- You manually removed it from WhatsApp Settings > Linked Devices
- Your phone was offline for more than 14 days
- WhatsApp forced a re-authentication (rare)

Re-pair using the Web UI.

### Bot replies to old messages after restart

Make sure `skip_history_sync = true` is set in the config. The 10-second grace period and 120-second message age check should prevent this, but history sync can deliver older messages that bypass these checks.

### Bot responds to messages I send from my phone

This should not happen. Homun filters self-messages (`is_from_me = true`). If you are seeing this behavior, check the logs for the sender ID — it may be a different WhatsApp account messaging you.

## Tips and Best Practices

- **Set `skip_history_sync = true`** to prevent processing old messages on first connect.
- **Configure `phone_number`** if you want proactive messaging (automations, cron jobs sending you WhatsApp messages).
- **Use `allow_from`** to restrict which phone numbers can interact with the bot, especially if your WhatsApp receives messages from many people.
- **Monitor the session**: check the Web UI's Channels page periodically to verify the WhatsApp connection is active.
