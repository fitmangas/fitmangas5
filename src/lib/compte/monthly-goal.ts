/** Objectif « cours suivis » pour la barre mensuelle (personnalisable via env). */
export function getMonthlySessionGoal(): number {
  const raw = process.env.NEXT_PUBLIC_MONTHLY_SESSION_GOAL;
  const n = raw ? parseInt(raw, 10) : 8;
  return Number.isFinite(n) && n > 0 ? n : 8;
}
