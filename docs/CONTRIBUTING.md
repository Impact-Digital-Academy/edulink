# Contributing rules

## Branches

- `main`: released, tagged code only. Never commit directly.
- `develop`: integration branch. Work merges here by pull request.
- `feature/short-name`: new work, branched from `develop`.
- `fix/short-name`: bug fixes, branched from `develop`.
- `hotfix/short-name`: urgent production fixes, branched from `main`, merged to both `main` and `develop`.

Keep branches short-lived (days, not weeks).

## Commit messages

Format: `type: what changed` in the present tense, under 72 characters.

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`, `security`.

Examples:

- `feat: add subject and level taxonomy tables`
- `fix: reject expired OTP codes`
- `docs: update decision log`

## Pull requests

1. One purpose per pull request. Small is better.
2. Fill in the pull request checklist completely.
3. The named reviewer (not the author) approves before merge.
4. Automated checks (lint, tests, dependency audit, secret scan) must pass.
5. Merge into `develop` with a squash merge so history stays readable.

## Secrets

- Never commit `.env` files, keys, tokens, certificates or Firebase configuration with real values.
- If a secret is committed by mistake: treat it as leaked, rotate it immediately, tell the project
  manager, and record it in docs/PROJECT_LOG.md.

## Database changes

Schema changes are made only through reviewed migrations. Never edit staging or production
databases by hand.

## Dependencies

Pin versions. Add a new dependency only with a reason in the pull request description (what it does,
why not built in, last release date, licence).
