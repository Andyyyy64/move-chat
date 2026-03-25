# move-chat

Move Claude Code chat sessions between machines with one command.

## Prerequisites

- Node.js 20+
- [GitHub CLI](https://cli.github.com/) (`gh`) installed and authenticated
- Claude Code installed on both machines

## Install

```bash
npm install -g move-chat
```

Or clone and link:

```bash
git clone https://github.com/Andyyyy64/move-chat.git
cd move-chat
npm install && npm run build && npm link
```

## Usage

### Send a session (on source machine)

```bash
move-chat push
```

This outputs a transfer code like `tiger-castle-river-a1b2c3...`

To push a specific session:

```bash
move-chat list                    # find the session ID
move-chat push -s 722b7363        # push by ID prefix
```

### Receive a session (on destination machine)

```bash
move-chat pull tiger-castle-river-a1b2c3...
```

If your project is at a different path:

```bash
move-chat pull tiger-castle-river-a1b2c3... --cwd /Users/me/dev/myproject
```

Then resume:

```bash
claude --resume <session-id>
```

### List local sessions

```bash
move-chat list
```

## How it works

1. **Pack** — Collects session data from `~/.claude/` (conversation, metadata, subagents)
2. **Encrypt** — AES-256-GCM encryption with a random key
3. **Transfer** — Uploads encrypted bundle to a private GitHub Gist
4. **Pull** — Downloads, decrypts, and places files in `~/.claude/` with path rewriting
5. **Cleanup** — Gist is auto-deleted after pull

## Security

- All data is encrypted with AES-256-GCM before leaving your machine
- The encryption key is encoded in the transfer code (never stored on GitHub)
- Private Gists are used (not publicly listed)
- Gists are deleted after successful transfer
