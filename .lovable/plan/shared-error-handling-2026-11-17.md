# Shared error handling

## User-facing behavior
- Add a small reusable error state with a Retry button.
- Show it on Home, Analytics, and Reports whenever a required query fails; retry the failed queries without blocking normal saving behavior.
- Add a top-level React error boundary so unexpected render errors show the same recovery state.

## Implementation
- Create shared `ErrorState` and top-level `ErrorBoundary` components using existing design-system controls and semantic tokens.
- Expose query errors and refetch functions from the existing transaction, settings, and category hooks.
- Check every query used by the three pages, including Reports’ comparison and trend queries, and wire Retry to the relevant refetches.
- Track this work in `roadmap.md` and record the new shared error-handling structure in `AGENTS.md`.

## Verification
- Run the project’s build/type checks and existing relevant tests.
- Verify the three pages render their error state and Retry control when their queries fail, and confirm the root boundary catches an unexpected render error.
