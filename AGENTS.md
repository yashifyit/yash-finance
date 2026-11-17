# Project rules

- Keep budget-warning calculations in a pure `src/lib` helper so the transaction sheet can display live projections and the rules can be tested independently.
- Keep shared render-error recovery in reusable root-level components, and expose query error/refetch state from hooks so pages can show a consistent retry state.