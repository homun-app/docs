# Memory & Knowledge

Homun has a multi-layered memory system that lets it remember context across conversations and search through your documents.

## Memory Layers

### Short-Term Memory

Session messages are kept in memory during a conversation. When you start a new session, previous messages are no longer in context but remain stored in the database for search.

### Long-Term Memory

Homun periodically consolidates important information from conversations into long-term memory summaries. These are stored in the database and searched automatically during future conversations to provide relevant context.

Daily memory files are written to `~/.homun/memory/YYYY-MM-DD.md`.

### User Profile

Homun maintains a profile about you at `~/.homun/brain/USER.md`. This file is updated through the `remember` tool -- when you tell Homun something important about yourself, it stores it here.

The user profile is included in every conversation to help Homun personalize its responses.

## Memory Search

When you ask Homun a question, it automatically searches its memory using a hybrid approach:

- **Vector search** (HNSW) -- finds semantically similar memories
- **Full-text search** (FTS5) -- finds exact keyword matches
- **RRF scoring** -- combines both results for best relevance

You can also manage memory through the Web UI under **Memory**, where you can browse, search, and edit stored memories.

## Knowledge Base (RAG)

The knowledge base lets you ingest documents so Homun can reference them during conversations.

### Supported Formats

Homun supports 30+ document formats:

| Category | Formats |
|----------|---------|
| Documents | Markdown, PDF, DOCX, TXT |
| Spreadsheets | XLSX, CSV |
| Code | Python, JavaScript, Rust, Go, and more |
| Web | HTML |

### Ingesting Documents

Upload documents through the Web UI under **Knowledge**, or use the knowledge tool during a conversation:

```
"Ingest this PDF into your knowledge base"
```

Homun chunks the document, generates embeddings, and indexes it for search.

### Directory Watcher

Point Homun at a directory and it will automatically ingest new or updated files:

```toml
[knowledge]
watch_dirs = ["~/Documents/notes"]
```

### Searching the Knowledge Base

The knowledge base is searched automatically when relevant to your question. Homun uses the same hybrid vector + full-text search as memory, so it finds both semantically similar and keyword-matching content.

### Sensitive Data Protection

Documents containing sensitive information (API keys, passwords, credentials) are automatically detected. Sensitive content is vault-gated, meaning it is stored encrypted and only accessed when explicitly needed.
