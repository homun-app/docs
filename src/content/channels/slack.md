# Slack

Connect Homun to your Slack workspace using Socket Mode (no public URL required).

## Setup

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App** > **From scratch**
3. Name it (e.g., "Homun") and select your workspace

### 2. Enable Socket Mode

1. Go to **Socket Mode** in the sidebar
2. Toggle **Enable Socket Mode** on
3. Create an app-level token with the `connections:write` scope
4. Copy the **App Token** (starts with `xapp-`)

### 3. Add Bot Scopes

1. Go to **OAuth & Permissions**
2. Under **Bot Token Scopes**, add:
   - `chat:write` -- send messages
   - `app_mentions:read` -- respond to mentions
   - `im:history` -- read DMs
   - `im:read` -- access DM channels

### 4. Enable Events

1. Go to **Event Subscriptions**
2. Toggle **Enable Events** on
3. Under **Subscribe to bot events**, add:
   - `app_mention`
   - `message.im`

### 5. Install to Workspace

1. Go to **Install App**
2. Click **Install to Workspace** and authorize
3. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

### 6. Configure Homun

Add to `~/.homun/config.toml`:

```toml
[channels.slack]
bot_token = "xoxb-your-bot-token"
app_token = "xapp-your-app-token"
```

### 7. Start the Gateway

```bash
homun gateway
```

## Configuration Reference

```toml
[channels.slack]
# Bot User OAuth Token (required)
bot_token = "xoxb-..."

# App-Level Token for Socket Mode (required)
app_token = "xapp-..."

# Restrict to specific channel IDs (optional)
allowed_channels = ["C01ABCDEFGH"]
```

## Usage

- **DM**: send a direct message to the bot in Slack
- **Channel**: mention the bot (`@Homun summarize today's messages`)

## Features

- Real-time messaging via Socket Mode (no public URL or ngrok needed)
- Markdown formatting with Slack's mrkdwn syntax
- File and image sharing
- Thread support for contextual replies
