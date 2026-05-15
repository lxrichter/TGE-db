# Data And Security

This repository is for platform code and sanitized documentation. It is not a place for confidential source data.

## Do Not Commit

Never commit:

- client-confidential data
- personal identifiers
- NDA-bound materials unless anonymized and explicitly approved
- production database files
- local SQLite databases
- database backups
- raw Excel source imports
- `.env` or `.env.local`
- passwords, tokens, API keys, or session secrets

## Git Ignore Policy

The repository excludes common local and sensitive materials through `.gitignore`, including:

- dependency folders
- generated Next.js output
- environment files
- SQLite database files
- Excel and CSV source data
- local source-data folders
- OS/editor metadata

Before any broad `git add`, check:

```bash
git status --short
git diff --cached --stat
```

If a data file appears unexpectedly, stop and update `.gitignore` before committing.

## Database Handling

Local runtime database files belong outside Git. Current local convention:

```text
shared/data/tge.db
```

Application configuration:

```text
web/.env.local
DB_PATH=../shared/data/tge.db
```

If development fixtures are needed, create a deliberately sanitized fixture with fake records and document it clearly.

## Authentication

The current prototype uses NextAuth credentials against a local `users` table.

Rules:

- do not commit real user exports
- do not document real passwords or temporary credentials in Git
- use local-only credentials for development previews
- use a strong `NEXTAUTH_SECRET` outside local development
- avoid exposing active staff account details in issue threads or docs

## AI And Research Workflow

AI may assist with:

- extraction
- summarization
- duplicate detection
- QA checks
- source triage

AI must not be treated as final authority for:

- publishing decisions
- commercial analysis conclusions
- source credibility judgments
- client-facing claims
- record approval without human review

## Public Repository Awareness

Assume anything committed to GitHub can be copied. Even private repositories should follow the same rule: commit code and sanitized docs only.
