# Project Context

Internal use only.

## Purpose

ThinkGeoEnergy is developing the TGE database into a geothermal intelligence platform. The long-term platform should combine structured market data, source material, research workflow, human interpretation, and AI-assisted analysis.

The goal is to become a core geothermal sector intelligence infrastructure, not just a searchable table.

## Current Position

The current platform exists and works as a prototype. It includes a useful data model, working internal workflows, and several application surfaces for projects, plants, companies, maps, markets, analysis, research operations, and administration.

The current implementation should be treated as:

- current implemented functionality
- a prototype for workflow and product behavior
- a specification source for the rebuild

It should not yet be treated as the final future-proof production platform.

## Strategic Direction

Confirmed direction:

- rebuild or substantially replatform where needed
- reuse domain logic, workflows, and lessons rather than blindly preserving current code
- move toward a stronger production database foundation, likely PostgreSQL
- build the semantic layer early
- prioritize projects, plants, and companies
- keep AI as an assistant to research and quality control, not as the decision-maker
- protect ThinkGeoEnergy intellectual property and consulting value

## Conceptual Platform Layers

Layer 1: Structured database

- projects
- plants
- companies
- relationships

Layer 2: Source data

- articles
- PDFs
- reports
- research notes

Layer 3: Semantic layer

- installed MW
- pipeline MW
- lifecycle phases
- operator, owner, developer, supplier, and investor roles

Layer 4: Research workflow

- staging
- validation
- approvals
- audit trail

Layer 5: Analysis layer

- dashboards
- market views
- comparison views
- exports

Layer 6: AI layer

- extraction support
- search
- summarization
- QA assistance

Layer 7: Access layer

- internal roles
- future subscriber access

These layers do not define build order. The build order is governed by audit findings, semantic clarity, workflow risk, and MVP priorities.

## Tooling Context

Current and expected tools:

- GitHub for version control
- VS Code and terminal for development
- Codex for validation and implementation support
- Claude / Claude Code for coding and structured development work
- ChatGPT for planning and strategy support
- PostgreSQL as likely future production database target
- Hetzner or another managed server environment for deployment

Long-term deployment should not rely on FTP-style manual updates.

## One-Line Strategy

Structure -> Meaning -> Workflow -> AI
