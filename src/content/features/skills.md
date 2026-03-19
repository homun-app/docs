# Skills

Skills extend Homun's capabilities through the open Agent Skills standard. Each skill is a self-contained package with a `SKILL.md` file that defines what the skill does and how to trigger it.

## What Are Skills?

A skill is a directory containing a `SKILL.md` file with YAML frontmatter that describes:

- **Name** and **description** -- what the skill does
- **Trigger conditions** -- when the skill activates
- **Scripts** -- optional executable scripts (Python, Bash, JavaScript)
- **Environment variables** -- secrets and config injected at runtime

Skills follow the open Agent Skills specification, making them portable across compatible AI assistants.

## Installing Skills

Install skills directly from GitHub:

```bash
homun skills add owner/repo
```

Homun downloads the repository, scans it for security issues, and installs the skill to `~/.homun/skills/`.

You can also install from the skill marketplace in the Web UI under **Skills**.

## Managing Skills

```bash
# List all installed skills
homun skills list

# Remove a skill
homun skills remove skill-name
```

## Skill Directories

Homun scans multiple directories for skills:

| Directory | Purpose |
|-----------|---------|
| `~/.homun/skills/` | User-installed skills |
| `./skills/` | Project-local skills |
| Built-in | 5 default skills bundled with Homun |

## Creating Custom Skills

Create a directory with a `SKILL.md` file:

```
my-skill/
  SKILL.md
  scripts/
    run.py
```

The `SKILL.md` uses YAML frontmatter to define the skill:

```markdown
---
name: my-skill
description: Does something useful
trigger: when the user asks about X
tools: [web_search, file]
env:
  - MY_API_KEY
---

## Instructions

Detailed instructions for the agent when this skill is active.
Tell the agent how to use the scripts and tools available.
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique skill identifier |
| `description` | Yes | Brief description (shown in listings) |
| `trigger` | No | When to activate (natural language) |
| `tools` | No | Restrict which tools the skill can use |
| `env` | No | Environment variables injected from vault |

## Skill Marketplace

Discover and install skills from two registries:

- **ClawHub** -- community marketplace for agent skills
- **OpenSkills** -- open registry of compatible skills

Browse available skills in the Web UI under **Skills > Marketplace**.

## Security

Before installing, Homun scans skill repositories for potentially dangerous patterns (shell commands, network calls, file system access). The scan results are shown before installation so you can review and approve.
