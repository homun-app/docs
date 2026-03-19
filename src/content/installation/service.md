# System Service

Install Homun as an OS service so it starts automatically on boot and runs in the background.

## Install the Service

Homun auto-detects your OS and installs the appropriate service:

```bash
homun service install
```

- **macOS**: creates a `launchd` plist (`~/Library/LaunchAgents/dev.homun.plist`)
- **Linux**: creates a `systemd` unit (`~/.config/systemd/user/homun.service`)

The service runs `homun gateway`, which includes the Web UI, all channels, scheduled tasks, and the heartbeat system.

## Managing the Service

### macOS (launchd)

```bash
# Start
launchctl load ~/Library/LaunchAgents/dev.homun.plist

# Stop
launchctl unload ~/Library/LaunchAgents/dev.homun.plist

# Check status
launchctl list | grep homun
```

### Linux (systemd)

```bash
# Start
systemctl --user start homun

# Stop
systemctl --user stop homun

# Restart
systemctl --user restart homun

# Check status
systemctl --user status homun
```

## Logs

### macOS

Logs are written to `~/Library/Logs/homun/`:

```bash
tail -f ~/Library/Logs/homun/homun.log
```

### Linux

View logs with `journalctl`:

```bash
journalctl --user -u homun -f
```

## Auto-Start on Boot

The service is configured to start automatically when you log in. To disable auto-start:

**macOS:**
```bash
launchctl unload -w ~/Library/LaunchAgents/dev.homun.plist
```

**Linux:**
```bash
systemctl --user disable homun
```

To re-enable:

**macOS:**
```bash
launchctl load -w ~/Library/LaunchAgents/dev.homun.plist
```

**Linux:**
```bash
systemctl --user enable homun
```

## Uninstall the Service

```bash
homun service uninstall
```

This stops the service and removes the service file. Your data in `~/.homun/` is not affected.
