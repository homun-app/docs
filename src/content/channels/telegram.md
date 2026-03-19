# Telegram

Connect Homun to Telegram so you can chat with it from any device.

## Setup

### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the prompts
3. Choose a name and username for your bot
4. Copy the bot token (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Configure Homun

Add the bot token to `~/.homun/config.toml`:

```toml
[channels.telegram]
token = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
```

### 3. Start the Gateway

```bash
homun gateway
```

### 4. Pair Your Account

1. Open Telegram and find your bot by its username
2. Send `/start`
3. Homun generates a one-time pairing code and shows it in the gateway logs
4. Send the code back to the bot
5. You are now paired -- the bot will only respond to you

## Group Usage

You can add Homun to a Telegram group:

1. Add the bot to your group
2. Mention the bot by name (e.g., `@your_bot_name how's the weather?`)
3. The bot responds in the group

To allow the bot to see all messages (not just mentions), disable privacy mode in BotFather:

1. Open @BotFather
2. Send `/mybots`, select your bot
3. Go to **Bot Settings** > **Group Privacy** > **Turn off**

## Configuration Reference

```toml
[channels.telegram]
# Bot token from @BotFather (required)
token = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"

# Restrict to specific Telegram user IDs (optional)
# If empty, pairing is used instead
allowed_users = [123456789]
```

## Features

- Text messages, photos, documents, and voice messages
- Streaming responses (edits the message as it generates)
- Inline keyboard for approval requests
- Markdown formatting in responses
