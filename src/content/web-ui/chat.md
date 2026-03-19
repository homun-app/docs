# Chat

The chat interface is where you interact with Homun through the Web UI. It provides a rich conversational experience with real-time streaming and tool visibility.

## Features

### Streaming Responses

Messages from Homun stream in real-time, token by token. You see the response as it is being generated, with no waiting for the full reply.

### Markdown Rendering

Responses are rendered with full Markdown support:

- Headings, bold, italic, lists
- Code blocks with syntax highlighting
- Tables
- Links and images

### Tool Execution Timeline

When Homun uses tools to answer your question, you can see each tool call in a collapsible timeline below the message. This shows:

- Which tool was called
- What parameters were used
- The tool's result
- How long it took

This transparency lets you understand exactly what Homun did to produce its answer.

### Multi-Session Support

Create multiple chat sessions to keep conversations organized:

- **New session** -- start a fresh conversation
- **Switch sessions** -- click any session in the sidebar
- **Delete sessions** -- remove old conversations

Each session maintains its own message history and context.

### File Uploads

Attach files to your messages by dragging and dropping or using the upload button. Supported file types include images, documents, and code files. Homun can read and analyze the uploaded content.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line |

## Mobile

The chat interface is fully responsive. On mobile devices, the sidebar collapses and the chat area fills the screen. All features work the same on mobile as on desktop.
