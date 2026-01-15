# Dependency Refresh

## Overview
Clean up npm deprecation warnings by updating direct dependencies and toolchain.

## Scope
- Update npm dependencies to supported major versions.
- Focus on ESLint/Jest tooling and any packages pulling deprecated transitive deps.

## Implementation Phases
1) Audit: `npm outdated` + identify deprecated transitive packages.
2) Upgrade direct dependencies (ESLint/Jest/tooling) with minimal breakage.
3) Validate: `npm run lint`, `npm test`.

## Success Criteria
- No deprecation warnings on `npm install`.
- Lint/test passes.

## Rollback Plan
- Revert dependency changes in git if tooling regressions appear.
