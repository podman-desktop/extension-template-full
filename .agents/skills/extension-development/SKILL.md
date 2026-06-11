# Extension Development

Use this guide for end-to-end feature work across backend/frontend/shared.

## Workflow

1. Define or update the contract in `packages/shared`.
2. Implement backend behavior in `packages/backend`.
3. Integrate UI in `packages/frontend`.
4. Validate with lint, typecheck, and tests.

## Typical touchpoints

- Shared API: `packages/shared/src/HelloWorldApi.ts`
- Backend impl: `packages/backend/src/api-impl.ts`
- Frontend client: `packages/frontend/src/api/client.ts`

## Validation

```sh
npm run typecheck
npm run test
```
