# Discord

Connect Homun to Discord as a bot that responds in DMs and server channels.

## Setup

### 1. Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** and give it a name
3. Go to the **Bot** section
4. Click **Reset Token** and copy the bot token

### 2. Enable Message Content Intent

Still in the Bot section:

1. Scroll down to **Privileged Gateway Intents**
2. Enable **Message Content Intent**
3. Save changes

This is required for the bot to read message content.

### 3. Invite the Bot to Your Server

1. Go to **OAuth2** > **URL Generator**
2. Select the `bot` scope
3. Under Bot Permissions, select:
   - Send Messages
   - Read Message History
   - Attach Files
   - Embed Links
4. Copy the generated URL and open it in your browser
5. Select your server and authorize

### 4. Configure Homun

Add to `~/.homun/config.toml`:

```toml
[channels.discord]
token = "your-bot-token-here"
```

### 5. Start the Gateway

```bash
homun gateway
```

The bot appears online in your server and responds to mentions and DMs.

## Configuration Reference

```toml
[channels.discord]
# Bot token from Developer Portal (required)
token = "your-bot-token-here"

# Restrict to specific guild (server) IDs (optional)
allowed_guilds = [123456789012345678]

# Command prefix for non-mention messages (optional, default: "!")
command_prefix = "!"
```

## Usage

- **DM**: send a direct message to the bot
- **Server**: mention the bot (`@Homun what time is it?`) or use the command prefix (`!what time is it?`)

## Features

- Text messages and file attachments
- Markdown formatting in responses
- Embed support for rich responses
- Auto-reconnect on connection drops
