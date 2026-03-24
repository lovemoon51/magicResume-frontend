# Magic Resume Standard Project Structure

```text
magic-resume/
|- apps/
|  |- web/
|  |  `- src/
|  |     |- app/
|  |     |- pages/
|  |     |- widgets/
|  |     |- features/
|  |     |- entities/
|  |     `- shared/
|  `- admin/
|     `- src/
|- services/
|  |- api/
|  |- ai-worker/
|  `- export-worker/
|- packages/
|  |- ui/
|  |- types/
|  |- api-client/
|  `- configs/
|- infra/
|- scripts/
|- tests/
`- docs/
```

## Responsibilities

- apps: End-user and admin applications
- services: Backend services split by single responsibility
- packages: Shared reusable packages with no business coupling
- infra: Deployment and infrastructure definitions
- scripts: Build and release automation
- tests: Cross-app E2E and contract tests
- docs: Architecture and API documentation

## Naming Rules

- Directory names: kebab-case
- React components: PascalCase
- Hooks: useXxx
- Service or util files: verb-noun
- Each module exposes a single entry: index.ts
- shared only contains business-agnostic capabilities
- Business logic must stay in features or entities

## Enforcement Baseline

- Keep module boundaries explicit and stable
- One module, one clear responsibility
- No cross-layer deep imports
- Prefer composition over implicit coupling
