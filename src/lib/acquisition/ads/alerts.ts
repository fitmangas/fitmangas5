/**
 * Alertes fatigue / kill — règles du corpus ADS_EXPERTISE (pas d’invention de chiffres).
 */

export type AdsAlert = {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  kind: 'fatigue' | 'kill' | 'data';
  title: string;
  detail: string;
  entityId: string | null;
  entityName: string | null;
};

export type InsightEntity = {
  entityId: string;
  entityName: string | null;
  level: string;
  spendCents: number;
  frequency: number | null;
  leads: number;
  clicks: number;
  ctr: number | null;
  cplCents: number | null;
  impressions: number;
  objectiveHint?: string | null;
};

function isCold(name: string | null | undefined, objective?: string | null): boolean {
  const s = `${name ?? ''} ${objective ?? ''}`.toLowerCase();
  return /froid|cold|quiz/.test(s) && !/warm|hot|retarget|essai/.test(s);
}

function isRetarget(name: string | null | undefined, objective?: string | null): boolean {
  const s = `${name ?? ''} ${objective ?? ''}`.toLowerCase();
  return /warm|retarget|chaud|hot|essai/.test(s);
}

/**
 * Fréquence froid > 3–4 → fatigue ; retarget > 5–7 → alerte forte.
 * Kill : spend ≥ 50–100 € et 0 lead / CTR très bas (après seuil spend, pas avant).
 */
export function computeAdsAlerts(entities: InsightEntity[]): AdsAlert[] {
  const alerts: AdsAlert[] = [];

  if (!entities.length) {
    alerts.push({
      id: 'no-data',
      severity: 'info',
      kind: 'data',
      title: 'Trop tôt pour analyser',
      detail:
        'Aucune ligne insights syncée. Lance une sync ou attends le cron quotidien. Zéros honnêtes — pas de faux CPL.',
      entityId: null,
      entityName: null,
    });
    return alerts;
  }

  const withSpend = entities.filter((e) => e.spendCents > 0 || e.impressions > 0);
  if (!withSpend.length) {
    alerts.push({
      id: 'zero-spend',
      severity: 'info',
      kind: 'data',
      title: 'Trop tôt pour analyser (0 € dépensé)',
      detail:
        'Compte connecté, insights lus, mais spend = 0. Active une campagne PAUSED → ACTIVE seulement après double confirmation + carte Meta.',
      entityId: null,
      entityName: null,
    });
  }

  for (const e of entities) {
    if (e.level !== 'campaign' && e.level !== 'adset' && e.level !== 'ad') continue;
    const freq = e.frequency;
    if (freq != null) {
      if (isCold(e.entityName, e.objectiveHint) && freq > 3.5) {
        alerts.push({
          id: `fatigue-cold-${e.entityId}`,
          severity: freq > 4 ? 'critical' : 'warning',
          kind: 'fatigue',
          title: `Fatigue audience froide · ${e.entityName ?? e.entityId}`,
          detail: `Fréquence ${freq.toFixed(2)} (> 3–4). Rafraîchis la créative (nouveau hook / UGC) plutôt que d’augmenter le budget.`,
          entityId: e.entityId,
          entityName: e.entityName,
        });
      }
      if (isRetarget(e.entityName, e.objectiveHint) && freq > 5.5) {
        alerts.push({
          id: `fatigue-rt-${e.entityId}`,
          severity: freq > 7 ? 'critical' : 'warning',
          kind: 'fatigue',
          title: `Fatigue retarget · ${e.entityName ?? e.entityId}`,
          detail: `Fréquence ${freq.toFixed(2)} (> 5–7). Pause ou rotate créative « suite d’histoire ».`,
          entityId: e.entityId,
          entityName: e.entityName,
        });
      }
    }

    // Kill criteria : ≥ 50 € et 0 lead, ou ≥ 100 € et CPL hors benchmark froid
    if (e.spendCents >= 5000 && e.leads === 0 && (e.ctr == null || e.ctr < 0.5)) {
      alerts.push({
        id: `kill-${e.entityId}`,
        severity: 'critical',
        kind: 'kill',
        title: `Kill candidate · ${e.entityName ?? e.entityId}`,
        detail: `${(e.spendCents / 100).toFixed(0)} € dépensés, 0 lead, CTR faible. Critère 50–100 € / 48–72 h — pause + nouvelle créative (brouillon PAUSED).`,
        entityId: e.entityId,
        entityName: e.entityName,
      });
    } else if (
      e.spendCents >= 10000 &&
      e.cplCents != null &&
      e.cplCents > 1800 &&
      isCold(e.entityName, e.objectiveHint)
    ) {
      alerts.push({
        id: `kill-cpl-${e.entityId}`,
        severity: 'warning',
        kind: 'kill',
        title: `CPL froid hors benchmark · ${e.entityName ?? e.entityId}`,
        detail: `CPL ${(e.cplCents / 100).toFixed(2)} € (> ~18 € benchmark froid FR). Tester nouveaux hooks avant de scaler.`,
        entityId: e.entityId,
        entityName: e.entityName,
      });
    }
  }

  return alerts;
}
