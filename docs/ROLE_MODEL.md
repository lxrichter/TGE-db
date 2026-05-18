# Role Model

Date: 2026-05-18

Purpose: define the canonical internal role model for the TGE geothermal
intelligence platform.

## Current Implemented Status

The current Next.js + SQLite prototype historically used:

- `viewer`
- `editor`
- `editor_export`
- `administrator`

Those legacy role values are still accepted by the code and mapped forward so
existing local users and older records continue to work.

The Railway PostgreSQL baseline initially used:

- `viewer`
- `analyst`
- `editor`
- `reviewer`
- `administrator`

A Prisma migration now aligns PostgreSQL `app_users.role_code` to the canonical
MVP role set below.

## Canonical MVP Roles

Use these role codes for new development:

| Role code | UI label | MVP meaning |
| --- | --- | --- |
| `researcher` | Researcher | View internal records, create draft records, edit non-approved records, add notes/sources, and submit work for validation. |
| `editor` | Editor | Create/edit records, approve records, manage validation work, and run standard exports. |
| `senior_editor` | Senior Editor | Senior review role with approval, export, and elevated workflow permissions. |
| `admin` | Admin | Full internal access including user management, governance, vocabularies, and system settings. |

## Legacy Mapping

Legacy values map as follows:

| Legacy role | Canonical role |
| --- | --- |
| `viewer` | `researcher` |
| `analyst` | `researcher` |
| `editor` | `editor` |
| `reviewer` | `senior_editor` |
| `editor_export` | `senior_editor` |
| `editor_plus` | `senior_editor` |
| `editor+` | `senior_editor` |
| `administrator` | `admin` |

## Permission Summary

Current implemented permission rules:

- all canonical roles can view internal records
- all canonical roles can create draft records
- all canonical roles can edit records in the current prototype
- `researcher` changes should move records toward validation/review
- `editor`, `senior_editor`, and `admin` can review/approve
- `editor`, `senior_editor`, and `admin` can export
- only `admin` can manage users
- only `admin` can import or manage system-level settings

Record approval still blocks self-approval.

Current approval logic:

- `editor` can approve researcher work
- `senior_editor` can approve researcher/editor work
- `admin` can approve any other user's work

## Implementation Notes

Code-level role logic lives in:

```text
web/lib/auth/roles.ts
```

The current auth session normalizes roles before exposing them to the app.

Admin user management now stores canonical role codes for new edits and new
users. Existing local SQLite records may still contain legacy role codes until
they are updated.

PostgreSQL role alignment migration:

```text
web/prisma/migrations/20260518000100_align_user_roles/migration.sql
```

## Future Direction

Future roles should remain separate from this MVP operational interface:

- external client/subscriber
- commercial/subscription manager
- API/data partner
- contributor/reviewer
- AI service account

External users should use a curated portal/API/export layer, not the internal
research operations interface.
