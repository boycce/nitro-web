---
name: nitro-browser-testing
description: Browser testing for projects using nitro-web only. Only use when explicitly asked to browser test (or is now implied after a previous request in the conversation).
---

# Login

  - Claude requests normally are auto-logged in as a dev user by detecting the browser agent (detects `Claude/` in the User-Agent). If its not working, check if the project's CLAUDE.md has a email section, and if found, use that email
