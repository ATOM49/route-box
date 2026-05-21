# route-box
An app to get map image data for a drawn route

## Local setup

Prerequisites:

- Node.js 22+
- pnpm 10.11.0 (`corepack use pnpm@10.11.0`)
- Docker with Docker Compose

Use the root automation scripts to provision a clean local environment:

```bash
corepack use pnpm@10.11.0
pnpm bootstrap
pnpm validate:setup
```

`pnpm bootstrap` installs dependencies, creates `.env` from `.env.example` when needed, starts Postgres and Redis via Docker Compose, generates the Prisma client, and pushes the current schema to the local database.

`pnpm validate:setup` checks the local services, validates Prisma, and runs the repository format, lint, typecheck, test, and build commands.
