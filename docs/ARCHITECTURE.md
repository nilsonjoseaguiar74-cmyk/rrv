# RRV.digital — Architecture

## Goal

Create a premium portfolio/hub whose public experience presents:

Growth × Experience × Engineering

as complementary capabilities inside one digital system.

RRV is not a traditional agency landing page and is not three static freelancer portfolios.

## Logical model

RRV
|
+-- Public Experience
|   |
|   +-- Hero
|   +-- Selected Work
|   +-- Professionals
|   +-- Capability / Knowledge Map
|   +-- Project Index
|   +-- Case Studies
|   +-- Contact
|
+-- Content Layer
|   |
|   +-- professionals[]
|   +-- projects[]
|   +-- knowledge[]
|   +-- disciplines[]
|   +-- media[]
|
+-- Admin (future)
|   |
|   +-- Authentication
|   +-- Professionals CRUD
|   +-- Projects CRUD
|   +-- Knowledge CRUD
|   +-- Disciplines CRUD
|   +-- Media
|   +-- Ordering
|   +-- Publishing
|
+-- Persistence (future)
    |
    +-- RRV PostgreSQL
    +-- RRV Media Storage

## Data principle

Three professionals is INITIAL CONTENT, not a structural limitation.

The application must render collections dynamically.

Never implement architectural fields such as:

professional1
professional2
professional3

Use normalized collections and identifiers.

## Initial domain types

Professional:
- id
- slug
- name
- title
- shortBio
- fullBio
- portrait
- disciplineIds[]
- knowledgeIds[]
- socialLinks[]
- featured
- active
- displayOrder

Project:
- id
- slug
- title
- subtitle
- shortDescription
- description
- challenge
- solution
- results
- cover
- media[]
- professionalIds[]
- knowledgeIds[]
- disciplineIds[]
- year
- status
- featured
- published
- displayOrder

Knowledge:
- id
- slug
- name
- category
- description
- icon
- featured
- active
- displayOrder

Discipline:
- id
- slug
- name
- shortName
- description
- accent
- displayOrder

Media:
- id
- type
- src
- alt
- width
- height
- poster
- caption

## Design direction

RRV visual thesis:

Growth.
Experience.
Engineering.

One digital system.

The identity should feel editorial, technological and precise.

Avoid:

- generic SaaS dashboard look
- excessive glassmorphism
- random particles
- generic AI purple/blue gradients
- arbitrary bento grids
- decorative motion without purpose
- permanent dependence on three equal cards

The signature interaction may use the RRV identity and the relationship among disciplines, while remaining scalable to additional professionals.

## Deployment boundary

Production VPS work is OUT OF SCOPE during frontend foundation.

Deployment will later use an isolated RRV environment with:

- exclusive project root
- exclusive Docker Compose project
- exclusive network
- exclusive PostgreSQL
- exclusive volumes
- localhost-only application port
- Nginx reverse proxy

No existing production project may be modified.
