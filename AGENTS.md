# RRV.digital — Engineering Contract

## Role
Work as a Senior Full Stack Engineer under the architectural direction of the RRV Head of Development.

## Product
RRV.digital is a premium digital hub and portfolio for multiple professionals.

Initial disciplines:

- Growth — ADS, marketing, performance, acquisition and analytics.
- Experience — Frontend, UX/UI, product design and interaction.
- Engineering — Fullstack, AI, Web3, Smart Contracts, architecture, solutions and DevOps.

The system MUST NOT assume there will always be exactly three professionals.

## Core architecture

The public frontend must be driven by data structures equivalent to:

- professionals[]
- projects[]
- knowledge[]
- disciplines[]
- media[]

No fixed number of professionals, projects, skills or disciplines may be hardcoded into the application architecture.

Relationships must support:

- one professional -> many projects
- one project -> many professionals
- one professional -> many knowledge items
- one knowledge item -> many professionals
- one project -> many knowledge items

## Frontend

Use:

- Next.js
- App Router
- TypeScript
- responsive-first implementation
- semantic HTML
- accessible keyboard navigation
- reduced-motion support
- reusable components
- centralized design tokens

Avoid generic template aesthetics.

Do not introduce visual libraries merely to make implementation faster if they compromise the custom RRV identity.

Motion must be deliberate and have a functional reason.

## Content layer

During the frontend phase use typed mock data.

The interface must later be able to replace:

mock data -> API -> PostgreSQL

without rebuilding the visual architecture.

## Admin

A future private /admin area will manage:

- professionals
- projects
- knowledge
- disciplines
- media
- ordering
- featured content
- publish/unpublish status

The admin controls CONTENT, not the visual design system.

Authentication must never be simulated with a password hardcoded in frontend JavaScript.

## Database

Production will use a PostgreSQL database exclusive to RRV.

Do not reuse databases, credentials, volumes or networks from any other project.

## VPS safety

The production VPS contains several active projects.

During development:

- DO NOT access the VPS
- DO NOT create or change production ports
- DO NOT modify Nginx
- DO NOT restart services
- DO NOT modify Docker resources outside RRV
- DO NOT assume a production port number

Production deployment will be handled separately and explicitly.

## Secrets

Never commit:

- passwords
- API keys
- tokens
- database credentials
- private keys

Use .env.example for variable names and local .env files for secrets.

## Git

Current development branch:

feat/rrv-foundation

Never make development changes directly on main.

Do not commit, push, merge or create a pull request unless explicitly requested.

Before considering a coding task complete, run all applicable:

- lint
- typecheck
- build
- tests

Report failures instead of hiding them.

## Change policy

Prefer incremental changes.

Do not perform broad refactors without a concrete reason.

Do not delete existing user work merely because another implementation would be easier.

Before adding a dependency, verify that it provides a real architectural benefit.

## Current priority

Build a robust, data-driven frontend foundation first.

Backend, PostgreSQL, admin authentication and VPS deployment come in later controlled phases.
