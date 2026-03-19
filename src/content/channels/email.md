# Email

Connect Homun to an email account so it can receive and respond to messages via email.

## Setup

### 1. Get Your Email Credentials

You need IMAP credentials (for receiving) and SMTP credentials (for sending). Most email providers support both. For Gmail, you will need an [App Password](https://support.google.com/accounts/answer/185833).

### 2. Configure Homun

Add to `~/.homun/config.toml`:

```toml
[channels.email]
enabled = true
poll_interval = 60  # check for new mail every 60 seconds

[channels.email.imap]
host = "imap.gmail.com"
port = 993
username = "you@gmail.com"
password = "your-app-password"

[channels.email.smtp]
host = "smtp.gmail.com"
port = 587
username = "you@gmail.com"
password = "your-app-password"
```

### 3. Start the Gateway

```bash
homun gateway
```

Homun checks the inbox at the configured interval and processes new messages.

## How It Works

1. Homun connects to your IMAP server and polls for unread messages
2. When a new email arrives from an allowed sender, it processes the content
3. The agent generates a response
4. The response is sent back as a reply via SMTP

## Configuration Reference

```toml
[channels.email]
# Enable the email channel (required)
enabled = true

# How often to check for new mail, in seconds (default: 60)
poll_interval = 60

# Only process emails from these senders (optional)
# If empty, all emails are processed
allowed_senders = ["colleague@example.com", "boss@example.com"]

[channels.email.imap]
host = "imap.gmail.com"
port = 993
username = "you@gmail.com"
password = "your-app-password"

[channels.email.smtp]
host = "smtp.gmail.com"
port = 587
username = "you@gmail.com"
password = "your-app-password"
```

## Provider Examples

### Gmail

Use an [App Password](https://support.google.com/accounts/answer/185833) (not your regular password):
- IMAP: `imap.gmail.com:993`
- SMTP: `smtp.gmail.com:587`

### Outlook / Microsoft 365

- IMAP: `outlook.office365.com:993`
- SMTP: `smtp.office365.com:587`

### Fastmail

- IMAP: `imap.fastmail.com:993`
- SMTP: `smtp.fastmail.com:587`

## Features

- HTML and plain text email parsing
- Attachment support (images, documents)
- Thread-aware replies (preserves email threading)
- Configurable polling interval
