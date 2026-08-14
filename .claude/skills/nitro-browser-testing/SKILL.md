---
name: nitro-browser-testing
description: For projects using nitro-web only. Browser testing a Nitro-web app. Use only when explicitly asked to open, click through, screenshot, or verify the app.
---

  By default, the user checks the UI themselves, so only do this when asked...

# Dev server

  - If not inside a git worktree, the user keeps the dev server running themselves, outside Claude Code.
  - If inside a git worktree, feel free to run the dev client and/or server yourself.
  - Client URL: If no /<PROJECT>/.claude/launch.json, the URL is generally `http://localhost:<PORT>`. Client PORT is found from .env.local OR .env

# Login

  - Nitro projects commonly auto-log in a dev user by detecting the browser agent (detects `Claude/` in the User-Agent).
  - If a sign in page still appears, check CLAUDE.md for dev credentials, and if they are there, submit and carry on without asking if it works.
  - If none are documented, ask the user for them and suggest adding them to CLAUDE.md so it doesn't come up again.

# Tips

  - `read_page` over `screenshot` for checking text and structure, it is cheaper and more reliable.
  - `read_console_messages` and `read_network_requests` are usually faster than clicking around when something is failing.
