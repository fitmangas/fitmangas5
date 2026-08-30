import type { LifecycleStage } from '@/lib/acquisition/types';

export const LIFECYCLE_ORDER: LifecycleStage[] = ['new', 'qualified', 'trial', 'paid', 'member'];

export function nextLifecycleStage(current: LifecycleStage): LifecycleStage | null {
  const idx = LIFECYCLE_ORDER.indexOf(current);
  if (idx < 0 || idx >= LIFECYCLE_ORDER.length - 1) return null;
  return LIFECYCLE_ORDER[idx + 1]!;
}

export function canEscalateToHuman(stage: LifecycleStage | string | undefined): boolean {
  return stage === 'qualified' || stage === 'trial' || stage === 'paid' || stage === 'member';
}

export function lifecycleLabel(stage: LifecycleStage): string {
  const map: Record<LifecycleStage, string> = {
    new: 'Nouveau',
    qualified: 'Qualifié',
    trial: 'Essai 7j',
    paid: 'Payant',
    member: 'Membre',
  };
  return map[stage] ?? stage;
}
