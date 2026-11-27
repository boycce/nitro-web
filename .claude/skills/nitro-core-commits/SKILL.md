---
name: nitro-core-commits
description: For the nitro-web repo itself only, not apps using it. Writing commits in packages/core or packages/webpack so they show up correctly in the changelog and readme, including how to flag a breaking change. Use when committing core changes or releasing a new nitro-web version.
---

# Commits

  - Format: `type(scope): summary`, e.g. `feat(auth): users can switch companies`
  - Only `feat`, `fix` and `perf` commits that touch `packages/core` or `packages/webpack` go in the changelog. Use `chore`, `docs`, `refactor` etc for anything users don't need to know about.
  - The summary is the changelog line, so write it for people using nitro: the outcome in plain English, lowercase, no full stop.

# Breaking changes

  - Add one `BREAKING:` line to the commit body, saying how to update, in one sentence:

  ```
  feat(auth): removing yourself moves you to your next company

  BREAKING: override removeMember if users must never remove themselves
  ```

  - Patches can be breaking too, the line is what flags it, not the version.
  - Don't use `BREAKING CHANGE:` or `!`, they aren't picked up.

# Releasing

  - `npm run patch`, `minor` or `major` from `packages/core`. After the bump, `changelog.js` runs and:
    - adds the release to the top of `packages/core/CHANGELOG.md`, one line per commit, with its breaking line under it
    - rewrites the tables at the bottom of `/readme.md`: the last 20 breaking changes, and the last 5 releases
  - Both files go into the release commit. Don't edit the block between the `<!-- changelog -->` markers by hand, it's overwritten.
  - A release with no `feat`, `fix` or `perf` commits adds no changelog entry.
