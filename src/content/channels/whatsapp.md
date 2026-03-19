# WhatsApp

Connect Homun to WhatsApp using a native Rust integration. No separate bridge, no Node.js required.

## Setup

### 1. Enable WhatsApp

Add to `~/.homun/config.toml`:

```toml
[channels.whatsapp]
enabled = true
```

### 2. Start the Gateway

```bash
homun gateway
```

### 3. Pair via QR Code

1. Open the Web UI (default: [http://localhost:18080](http://localhost:18080))
2. Go to **Channels** > **WhatsApp**
3. Click **Pair**
4. A QR code appears on screen
5. On your phone, open WhatsApp > **Settings** > **Linked Devices** > **Link a Device**
6. Scan the QR code

The session is now established and persists across restarts.

## How It Works

Homun uses [wa-rs](https://github.com/nickelc/wa-rs), a pure Rust WhatsApp Web client. There is no external WhatsApp bridge or Node.js process involved. The session credentials are stored locally and the connection resumes automatically when the gateway starts.

## Configuration Reference

```toml
[channels.whatsapp]
# Enable the WhatsApp channel (required)
enabled = true

# Restrict to specific phone numbers (optional)
# Use international format without the + prefix
allowed_numbers = ["1234567890"]
```

## Re-Pairing

If the session expires (e.g., you removed the linked device from your phone), repeat the QR pairing process from the Web UI.

## Features

- Text messages and media (photos, documents, voice)
- Typing indicators (shows "typing..." while generating)
- Presence status (shows as online when gateway is running)
- Session persistence (no re-pairing needed on restart)
