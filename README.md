# Brightloop Subscription Management System

Phase 1 establishes the MERN project foundation. Domain features are intentionally not implemented yet.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer

## Install

```bash
npm install
```

Copy the environment templates before running locally:

```text
server/.env.example -> server/.env
client/.env.example -> client/.env
```

The templates contain development-safe defaults and no credentials.

## Commands

```bash
npm run dev:server
npm run dev:client
npm run lint
npm test
npm run build
npm run check
```

The server listens on `http://localhost:5000` by default. Health endpoints:

- `GET /health/live`
- `GET /health/ready`
- `GET /api/v1/health`

The readiness endpoint reports application and MongoDB connectivity status. A `503` response means the process is alive but not ready to serve database-dependent work.
