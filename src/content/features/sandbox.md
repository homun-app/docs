# Sandbox

When Homun executes shell commands, they run inside an isolated sandbox by default. This prevents accidental damage to your system and limits what commands can access.

## How It Works

The sandbox restricts:

- **Filesystem access** -- commands can only read/write within allowed directories
- **Network access** -- outbound connections can be limited
- **Process isolation** -- commands run in a contained environment

## Backends

Homun supports 4 sandbox backends and automatically selects the best one available on your system:

| Backend | Platform | Isolation Level |
|---------|----------|----------------|
| **Docker** | All | Full container isolation (recommended) |
| **Native (sandbox-exec)** | macOS | Kernel-level sandboxing |
| **Bubblewrap** | Linux | Namespace-based isolation |
| **Job Objects** | Windows | Process group restrictions |

## Configuration

```toml
[sandbox]
backend = "docker"    # docker, native, bubblewrap, or auto
enabled = true
```

When set to `auto` (the default), Homun detects which backends are available and picks the strongest one.

### Docker Backend

Docker provides the strongest isolation. Commands run inside a container with:

- No access to the host filesystem (except mounted directories)
- Separate network namespace
- Resource limits (CPU, memory)

Make sure Docker is installed and running:

```bash
docker --version
```

### Native Backend (macOS)

On macOS, the native backend uses Apple's `sandbox-exec` for kernel-level restriction. No additional software needed.

### Bubblewrap Backend (Linux)

On Linux, install Bubblewrap for namespace-based isolation:

```bash
# Debian/Ubuntu
sudo apt install bubblewrap

# Fedora
sudo dnf install bubblewrap
```

## When to Disable the Sandbox

In some cases you may need to disable the sandbox:

- Running system administration commands that need full access
- Installing software that requires root privileges
- Accessing hardware devices

You can disable it per-command by telling Homun to run a command without the sandbox, or globally:

```toml
[sandbox]
enabled = false
```

Keep the sandbox enabled for everyday use. Only disable it when you trust the commands being executed and understand the implications.
