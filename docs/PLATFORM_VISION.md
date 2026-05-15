# Platform Vision

Internal use only.

This document captures the intended direction for the platform to be built. It is not a description of the current codebase as-is.

## Vision

ThinkGeoEnergy is building a geothermal intelligence platform that combines structured data, historical source material, research workflows, interpretation, and AI-assisted support.

The platform should become geothermal sector intelligence infrastructure: a connected system for understanding projects, plants, companies, relationships, market activity, and evidence behind the data.

## Target Platform

The target platform should connect:

- geothermal projects
- operating plants
- companies and company groups
- asset roles and relationships
- lifecycle history
- ThinkGeoEnergy articles and news history
- PDFs, reports, and external documents
- dashboards, maps, comparisons, and exports
- internal research workflows
- future subscriber access
- AI-assisted research and QA workflows

## Relationship To Current Code

The current Next.js + SQLite application is earlier work and should be used as a reference asset.

Use it to identify:

- useful entity structures
- practical UI patterns
- editorial workflow ideas
- validation logic
- import and export requirements
- auth and role concepts
- domain-specific assumptions that need to be preserved or improved

Do not assume the current implementation is the final architecture.

The expected approach is:

1. audit the current app and database
2. extract reusable domain and workflow knowledge
3. define the semantic model
4. design the future data architecture
5. rebuild or replatform with stronger foundations

## Strategic Decisions

Confirmed direction:

- rebuild or substantially replatform where needed
- reuse logic and learning, not necessarily code
- move toward a stronger database foundation, likely PostgreSQL
- prioritize projects, plants, and companies
- build semantic clarity before adding complex AI features
- use AI for internal efficiency first
- treat future AI product features as secondary but important
- protect ThinkGeoEnergy intellectual property and consulting value

## Conceptual Layers

Layer 1: Structured database

- projects
- plants
- companies
- relationships

Layer 2: Source data

- articles
- PDFs
- reports
- source notes

Layer 3: Semantic layer

- installed MW
- pipeline MW
- project phase
- operating capacity
- owner, operator, developer, supplier, investor, and EPC logic

Layer 4: Research workflow

- staging
- validation
- approval
- audit trail

Layer 5: Analysis layer

- dashboards
- comparisons
- maps
- exports
- market views

Layer 6: AI layer

- extraction support
- summarization
- QA assistance
- search

Layer 7: Access layer

- internal roles
- future subscribers

These layers are conceptual. They do not define build order.

## Build Principle

Structure -> Meaning -> Workflow -> AI

The platform should first make geothermal data structured and meaningful, then make the research workflow reliable, then add AI and subscriber-facing product layers on top.
