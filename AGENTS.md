# AGENTS.md

## Project Overview

Full Podman Desktop extension template with separate backend, frontend, and
shared packages. This template demonstrates a production-style setup for RPC
communication between a Svelte webview and extension backend.

- **Tech stack**: TypeScript, Svelte 5, Tailwind CSS, npm workspaces
- **Packages**: `packages/backend`, `packages/frontend`, `packages/shared`
- **Extension API**: `@podman-desktop/api`

## Quick Start

```sh
npm install
npm run build
```

## Essential Commands

```sh
npm run build          # build frontend + backend
npm run watch          # watch frontend + backend
npm run lint:check
npm run lint:fix
npm run format:check
npm run format:fix
npm run typecheck
npm run test
```

## Single-File Verification

```sh
npx eslint path/to/file.ts
npx tsc --noEmit -p packages/backend/tsconfig.json
npx tsc --noEmit -p packages/frontend/tsconfig.json
npx tsc --noEmit -p packages/shared/tsconfig.json
npm run test:backend
npm run test:frontend
npm run test:shared
```

## Skills

Task-specific guidance lives in `.agents/skills/`:

- `extension-development` - backend/frontend/shared change flow
- `svelte-ui-design` - Svelte 5 component and state guidance
- `unit-testing` - backend/frontend/shared test strategy

## Architecture

Webview (frontend) <-> shared contract <-> backend extension

- `packages/backend`: extension activation and Podman Desktop API integrations.
- `packages/frontend`: Svelte webview UI.
- `packages/shared`: shared interfaces and RPC/message contracts.

## Pattern References

- New backend API method: update `packages/shared/src/HelloWorldApi.ts` and `packages/backend/src/api-impl.ts`
- New frontend integration: update `packages/frontend/src/api/client.ts` and consuming Svelte component
- New shared model/message: place in `packages/shared/src`
