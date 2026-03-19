# Chat

The chat interface is where you interact with Homun through the Web UI. It provides a rich conversational experience with real-time streaming, full markdown rendering, tool execution visibility, multi-session support, and file uploads.

## Streaming Responses

Messages from Homun stream in real-time, token by token. You see the response as it is being generated, with no waiting for the full reply. This uses Server-Sent Events (SSE) over a WebSocket connection for low-latency delivery.

Streaming works for:
- Regular text responses
- Code blocks (syntax highlighting applies as the code streams in)
- Markdown formatting (renders progressively)
- Tool call results (appear inline as tools complete)

You can interrupt a streaming response by sending a new message. The current generation stops and Homun processes your new input.

## Markdown Rendering

Responses are rendered with full Markdown support:

- **Text formatting**: headings (H1-H6), bold, italic, strikethrough
- **Lists**: ordered, unordered, nested, checkbox lists
- **Code blocks**: syntax highlighting for 100+ languages, with a copy button on each block
- **Inline code**: rendered with a monospace font and subtle background
- **Tables**: rendered as formatted HTML tables with borders and alignment
- **Links**: clickable, open in new tab
- **Images**: rendered inline (from URLs or uploaded files)
- **Blockquotes**: styled with a left border
- **Horizontal rules**: visual separators
- **LaTeX**: mathematical expressions rendered via KaTeX (both inline `$...$` and block `$$...$$`)

Code blocks include a copy button in the top-right corner. Click it to copy the code to your clipboard. The language is detected automatically from the code or from the language tag in the fenced code block.

## Tool Execution Timeline

When Homun uses tools to answer your question, each tool call appears in an expandable timeline below the message. This gives full transparency into what Homun did.

### What the Timeline Shows

Each tool call entry displays:
- **Tool name**: which tool was called (e.g., `web_search`, `file`, `shell`)
- **Parameters**: what arguments were passed to the tool
- **Result**: the tool's output (truncated for large results, expandable)
- **Duration**: how long the tool call took
- **Status**: success or failure indicator

### Expanding and Collapsing

Tool calls are collapsed by default to keep the conversation clean. Click on a tool call to expand it and see the full parameters and result. Click again to collapse.

For complex interactions that involve many tool calls (e.g., research tasks with multiple web searches), the timeline helps you understand the chain of actions Homun took.

### Thinking/Reasoning Blocks

When using models that support extended thinking (like Claude with thinking enabled), the reasoning process appears in a collapsible block. This shows you the LLM's thought process before it takes action. Thinking blocks are collapsed by default and styled differently from regular messages.

## Multi-Session Support

The chat supports multiple concurrent sessions, letting you keep conversations organized by topic or task.

### Creating Sessions

- Click the **New Session** button in the sidebar to start a fresh conversation
- Each session gets an auto-generated name based on its first message
- You can rename sessions by clicking on the session name

### Switching Sessions

- Click any session in the sidebar to switch to it
- The message history loads immediately from SQLite
- The session's full context is restored (the LLM sees all previous messages in that session)

### Session Persistence

Sessions are stored in the SQLite database (`~/.homun/homun.db`):
- Message history persists across gateway restarts
- Sessions from all channels are visible (CLI, Telegram, Web, etc.)
- Each session records its channel of origin

### Deleting Sessions

Right-click a session in the sidebar or use the delete button to remove it. This deletes the session and all its messages from the database. Memories consolidated from the session remain in long-term memory.

### Session Naming

Sessions are automatically named based on the first message or topic. You can rename them at any time for better organization. The name is purely cosmetic -- it does not affect the conversation context.

## File Uploads

Attach files to your messages for Homun to analyze, reference, or process.

### How to Upload

- **Drag and drop**: drag files onto the chat area
- **Click**: click the upload button (paperclip icon) to open a file picker
- **Paste**: paste images directly from your clipboard

### Supported File Types

| Category | Types |
|----------|-------|
| Images | PNG, JPG, JPEG, GIF, WebP, SVG |
| Documents | PDF, TXT, MD, DOCX, RTF |
| Code | Any text-based source code file |
| Data | JSON, CSV, YAML, TOML, XML |

### How Files Are Processed

- **Images**: sent to the LLM as visual input (if the model supports vision). Homun can describe, analyze, and answer questions about uploaded images.
- **Text files**: content is read and included in the message context. Homun can analyze, summarize, or edit the content.
- **PDFs**: text is extracted and included in context.
- **Large files**: if a file is too large for the context window, it is automatically chunked and the most relevant sections are included.

Files are stored temporarily during the session. They are not permanently stored unless you explicitly ask Homun to save them or add them to the knowledge base.

### Multiple Files

You can upload multiple files in a single message. All files are processed and available to Homun in that conversation turn.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line (without sending) |
| `Escape` | Cancel current streaming response |
| `Ctrl/Cmd + K` | Focus the message input |

The message input supports multi-line text. Use `Shift + Enter` to add line breaks within your message.

## WebSocket Connection

The chat uses a WebSocket connection for real-time bidirectional communication:

- **Connection**: established automatically when you open the chat page
- **Reconnection**: if the connection drops (network interruption, gateway restart), the chat automatically reconnects with exponential backoff
- **Status indicator**: a connection indicator shows whether the WebSocket is connected, connecting, or disconnected
- **Heartbeat**: periodic ping/pong messages keep the connection alive through proxies and load balancers

If the connection is lost mid-stream, the partial response is preserved. When the connection is restored, you can continue the conversation from where it left off.

### Connection States

| State | Indicator | Behavior |
|-------|-----------|----------|
| Connected | Green dot | Normal operation, messages send/receive instantly |
| Connecting | Yellow dot | Attempting to connect or reconnect |
| Disconnected | Red dot | No connection. Messages are queued and sent on reconnect. |

## Mobile Experience

The chat interface is fully responsive and optimized for mobile devices:

- **Full-width layout**: the sidebar collapses, giving the chat area the full screen width
- **Touch-friendly input**: the message input and send button are sized for touch interaction
- **Scrolling**: smooth scrolling through long conversations
- **File upload**: tap the upload button or use the share sheet to upload from your phone
- **Virtual keyboard**: the layout adjusts when the keyboard appears to keep the input visible

All features work the same on mobile as on desktop. The tool timeline, markdown rendering, and file uploads are fully functional on small screens.

## Customization

### Message Display

Messages are displayed with:
- Clear visual distinction between user messages and Homun's responses
- Timestamps on hover
- Avatar icons for user and assistant
- Read-more expansion for very long messages

### Streaming Speed

The streaming speed depends on your LLM provider and model. Faster models (like Claude Haiku or GPT-4o-mini) stream faster. The Web UI renders tokens as quickly as they arrive with no artificial delay.

## Troubleshooting

### Messages Not Sending

**Symptom**: clicking Send does nothing, or the message appears to hang.

**Check**:
1. Look at the connection indicator -- is the WebSocket connected?
2. Check the browser console for errors (F12 > Console)
3. Verify the gateway is running and the Web UI port is accessible

### Streaming Stops Mid-Response

**Symptom**: Homun's response cuts off abruptly.

**Causes**:
- WebSocket disconnection -- the connection indicator will show disconnected
- LLM timeout -- the provider may have timed out on a long response
- Context window exceeded -- very long conversations may exceed the model's limits

**Fix**: start a new session if the conversation has grown very long. Important context from the old session is preserved in long-term memory.

### Code Blocks Not Highlighting

**Symptom**: code appears as plain text without syntax highlighting.

**Check**: ensure the code block has a language tag. Fenced code blocks with a language identifier (e.g., `` ```python ``) get syntax highlighting. Blocks without a language tag render as plain monospace text.
