// Pure helpers for savings goal amounts.
export function applyGoalChange(current: number, target: number, delta: number) {
  const next = Math.max(0, Math.round((Number(current) + delta) * 100) / 100);
  return { current_amount: next, is_completed: next >= Number(target) };
}

export function goalPercent(current: number, target: number) {
  if (!target || target <= 0) return 0;
  return Math.round((Number(current) / Number(target)) * 100);
}
