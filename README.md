# route-box
An app to get map image data for a drawn route

## Local setup

Prerequisites:

- Node.js 22+
- pnpm 10.11.0 (or Corepack, which the bootstrap/validation scripts can use automatically)
- Docker with Docker Compose

Use the root automation scripts to provision a clean local environment:

```bash
nvm use
pnpm bootstrap
pnpm validate:setup
```

The project includes `.nvmrc`, and the bootstrap/validation scripts automatically run `nvm use 22` when `nvm` is available.

`pnpm bootstrap` installs dependencies, creates `.env` and `.env.local` from their example files when needed, starts Postgres and Redis via Docker Compose, generates the Prisma client, and pushes the current schema to the local database.

`pnpm validate:setup` loads both `.env` and `.env.local`, checks the local services, validates Prisma, and runs the repository format, lint, typecheck, test, and build commands.
