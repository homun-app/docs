# Slack

Connect Homun to your Slack workspace. Homun supports two connection modes: **Socket Mode** (recommended, real-time, no public URL needed) and **HTTP polling** (fallback, no app-level token required). Both modes use the Slack Web API for sending messages.

## Quick Setup

1. Create a Slack app at api.slack.com
2. Enable Socket Mode and get an app-level token
3. Add bot token scopes and event subscriptions
4. Install the app to your workspace
5. Add both tokens to `~/.homun/config.toml`
6. Run `homun gateway`

## Socket Mode vs HTTP Polling

Homun supports two ways to receive messages from Slack:

| Feature | Socket Mode | HTTP Polling |
|---|---|---|
| Requires app_token | Yes (`xapp-*`) | No |
| Requires public URL | No | No |
| Latency | Real-time (sub-second) | ~3 seconds |
| Events delivery | Push (WebSocket) | Pull (conversations.history API) |
| Recommended for | All deployments | Legacy or restricted setups |

**Socket Mode** is the recommended approach. It uses a WebSocket connection from Homun to Slack's servers, meaning no public URL, no ngrok, no webhook endpoint is needed. Events arrive in real-time.

**HTTP Polling** is the fallback when no `app_token` is configured. Homun polls `conversations.history` every 3 seconds and auto-discovers all channels the bot is a member of. This is simpler to set up but has higher latency and uses more API calls.

The mode is selected automatically based on whether `app_token` is configured:

```
app_token present → Socket Mode
app_token empty   → HTTP Polling
```

## Step-by-Step App Creation

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App** > **From scratch**
3. Name it (e.g., "Homun") and select your workspace
4. Click **Create App**

### 2. Enable Socket Mode

1. In the left sidebar, click **Socket Mode**
2. Toggle **Enable Socket Mode** on
3. You are prompted to create an app-level token. Give it a name (e.g., "socket-token") and add the `connections:write` scope
4. Click **Generate**
5. Copy the **App Token** (starts with `xapp-`)

### 3. Add Bot Token Scopes

1. Go to **OAuth & Permissions** in the sidebar
2. Scroll to **Bot Token Scopes**
3. Add these scopes:

| Scope | Purpose |
|---|---|
| `chat:write` | Send messages |
| `app_mentions:read` | Receive @mention events |
| `im:history` | Read DM message history |
| `im:read` | Access DM channels |
| `channels:history` | Read public channel history (for polling mode) |
| `channels:read` | List public channels (for auto-discovery) |
| `groups:history` | Read private channel history (optional) |
| `groups:read` | List private channels (optional) |

At minimum, you need `chat:write`, `app_mentions:read`, `im:history`, and `im:read`. Add `channels:*` scopes if you want the bot to work in public channels.

### 4. Enable Event Subscriptions

1. Go to **Event Subscriptions** in the sidebar
2. Toggle **Enable Events** on
3. Under **Subscribe to bot events**, add:

| Event | Purpose |
|---|---|
| `app_mention` | Triggers when someone @mentions the bot in a channel |
| `message.im` | Triggers when someone sends a DM to the bot |

4. Click **Save Changes**

### 5. Install to Workspace

1. Go to **Install App** in the sidebar
2. Click **Install to Workspace**
3. Review the permissions and click **Allow**
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

### 6. Configure Homun

Add both tokens to `~/.homun/config.toml`:

```toml
[channels.slack]
token = "xoxb-your-bot-token"
app_token = "xapp-your-app-token"
```

### 7. Start the Gateway

```bash
homun gateway
```

You should see:

```
INFO Slack starting in Socket Mode (real-time)
INFO Slack Socket Mode: WebSocket connected
```

## Configuration Reference

```toml
[channels.slack]
# Bot User OAuth Token (required)
token = "xoxb-..."

# App-Level Token for Socket Mode (optional, but recommended)
# If empty, falls back to HTTP polling
app_token = "xapp-..."

# Channel ID to monitor (optional)
# Empty or "*" = auto-discover all accessible channels
# Set a specific channel ID to limit the bot to one channel
channel_id = ""

# Default channel ID for proactive/cross-channel messaging (optional)
# Falls back to channel_id if empty
default_channel_id = ""

# Restrict to specific Slack user IDs (optional)
allow_from = ["U01ABCDEFGH"]

# Require OTP pairing for unknown senders (default: false)
pairing_required = false

# In channels, only respond when @mentioned (default: true)
mention_required = true

# Response mode: automatic, assisted, on_demand, silent (default: automatic)
response_mode = "automatic"

# Persona: bot, owner, company, custom (default: bot)
persona = "bot"

# Default tone of voice for this channel
tone_of_voice = ""

# Channel to send draft notifications when in assisted mode
# notify_channel = "web"
# notify_chat_id = ""

# Named agent to handle messages (empty = default agent)
# default_agent = ""
```

### Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `token` | String | (required) | Bot User OAuth Token (`xoxb-*`) |
| `app_token` | String | `""` | App-Level Token (`xapp-*`) for Socket Mode. Empty = HTTP polling fallback |
| `channel_id` | String | `""` | Channel ID to monitor. Empty or `*` = auto-discover all accessible channels |
| `default_channel_id` | String | `""` | Channel ID for proactive messages. Falls back to `channel_id` |
| `allow_from` | Array of strings | `[]` | Slack user IDs allowed to interact |
| `pairing_required` | Boolean | `false` | Require OTP verification for unknown senders |
| `mention_required` | Boolean | `true` | In channels, only respond when @mentioned |
| `response_mode` | String | `"automatic"` | How the agent handles messages |
| `persona` | String | `"bot"` | How the agent presents itself |
| `tone_of_voice` | String | `""` | Default communication style |
| `notify_channel` | String | (none) | Where to send drafts in assisted mode |
| `notify_chat_id` | String | (none) | Chat ID on the notify channel |

### Finding Slack IDs

- **User ID**: click on a user's name in Slack > **View full profile** > click the three-dot menu > **Copy member ID**
- **Channel ID**: right-click a channel name > **View channel details** > the ID is at the bottom of the details panel (starts with `C`)

## Features

### Message Handling

When a Slack message arrives:

1. Homun checks if the message is from a real user (ignores bot messages and subtypes like `channel_join`, `message_changed`)
2. Mention gating is applied (if `mention_required = true`, only @mentioned messages pass through)
3. The message is forwarded to the agent with full tool access
4. The response is sent back to the same channel (or thread, if applicable)

### DM vs Channel Behavior

| Behavior | DM | Channel |
|---|---|---|
| Mention required | No (always responds) | Yes (when `mention_required = true`) |
| Auto-discovery | Always included | Based on bot membership |
| Thread replies | No (flat) | Yes (preserves thread context) |

In DMs, the bot responds to every message. In channels, the default behavior is to only respond when @mentioned.

### Thread Support

Slack messages include thread context. When a user sends a message in a thread, Homun:

1. Detects the `thread_ts` (thread timestamp)
2. Includes the thread ID in the message metadata
3. Sends the response back to the same thread

This preserves conversational context within threads. If a message is not in a thread, the response is sent to the main channel.

### Mention Handling

When the bot is @mentioned, the mention tag (`<@U_BOT_ID>`) is automatically stripped from the message. The agent sees clean text without the mention.

If `mention_required = false`, the bot processes all messages in all channels it has access to — which can be noisy in active workspaces.

### Channel Auto-Discovery

When `channel_id` is empty or set to `"*"`, Homun automatically discovers all channels the bot is a member of:

- In **Socket Mode**: events arrive for any channel the bot is in, filtering is applied per-event
- In **HTTP Polling**: Homun calls `conversations.list` every 60 seconds to discover new channels, then polls `conversations.history` for each one

To add the bot to a channel: type `/invite @Homun` in the channel, or drag the bot into the channel from the members list.

### Proactive Messaging

When `default_channel_id` is configured, Homun can send proactive messages to Slack (e.g., from automations, cron jobs, or cross-channel routing). Without it, the bot can only reply to incoming messages.

### Message Deduplication

Both Socket Mode and HTTP Polling track the last processed timestamp per channel to prevent processing the same message twice. In Socket Mode, the envelope ID is also ACKed within 3 seconds as required by Slack's protocol.

## Socket Mode Details

Socket Mode uses a WebSocket connection to receive events:

1. Homun calls `apps.connections.open` with the app token to get a fresh WebSocket URL
2. Opens the WebSocket connection
3. Receives event envelopes (JSON frames)
4. Sends an ACK response within 3 seconds for each envelope (Slack requires this)
5. Processes the event payload

If the WebSocket connection drops (server close, network error, `disconnect` event), Homun automatically reconnects after 3 seconds with a fresh URL.

### Handling Disconnects

Slack may send a `disconnect` event to request the client reconnect (e.g., for server rotation). Homun handles this gracefully:

```
WARN Slack Socket Mode: disconnect event received
WARN Slack Socket Mode: reconnecting in 3s...
INFO Slack Socket Mode: WebSocket connected
```

## Security

### Restricting Access

Use `allow_from` to limit which Slack users can interact with the bot:

```toml
allow_from = ["U01ABCDEFGH", "U02IJKLMNOP"]
```

### Pairing

When `pairing_required = true`, unknown senders receive a 6-digit OTP code in the gateway logs. They must send it back to verify. Once paired, they are remembered permanently.

### Token Security

- The **bot token** (`xoxb-*`) grants API access to your workspace. Keep it secret.
- The **app token** (`xapp-*`) is used only for Socket Mode connections. It has limited scope (`connections:write` only).
- Both tokens can be stored encrypted using Homun's vault: set the value to `***ENCRYPTED***` in config.toml and store the actual token via `homun vault set`.

## Troubleshooting

### "Slack auth.test failed"

The bot token is invalid or has been revoked. Go to api.slack.com/apps > your app > Install App, and reinstall to get a new bot token.

### "Slack apps.connections.open failed"

The app token is invalid or Socket Mode is not enabled. Check:

1. Socket Mode is enabled in the app settings
2. The app token has the `connections:write` scope
3. The token has not been revoked

### Bot does not respond in channels

1. **Check mention_required**: if `true`, you must @mention the bot
2. **Check channel membership**: the bot must be invited to the channel (`/invite @Homun`)
3. **Check event subscriptions**: verify `app_mention` is subscribed in Event Subscriptions
4. **Check scopes**: verify the bot has `channels:history` scope for public channels

### Bot does not respond to DMs

1. **Check event subscriptions**: verify `message.im` is subscribed
2. **Check scopes**: verify the bot has `im:history` and `im:read` scopes
3. **Check allow_from**: if set, verify your Slack user ID is in the list

### Socket Mode connects then immediately disconnects

This usually means the app token has expired or the WebSocket URL is stale. The bot will automatically reconnect. If it keeps cycling:

1. Generate a new app-level token in the app settings
2. Update `config.toml` with the new token
3. Restart the gateway

### HTTP Polling mode: high API usage

In polling mode, Homun makes API calls every 3 seconds per channel, plus channel discovery every 60 seconds. For workspaces with many channels, this can consume significant API quota. Switch to Socket Mode to eliminate polling.

## Tips and Best Practices

- **Use Socket Mode** for all deployments. It is faster, more reliable, and uses fewer API calls than HTTP polling.
- **Set `channel_id`** to a specific channel if you want to limit the bot to one channel. This is useful for testing or dedicated bot channels.
- **Set `default_channel_id`** if you want automations or cron jobs to post messages to Slack.
- **Invite the bot** to channels where you want it to be available. The bot cannot see messages in channels it has not been added to.
- **Use threads** for multi-turn conversations in busy channels. The bot preserves thread context automatically.
