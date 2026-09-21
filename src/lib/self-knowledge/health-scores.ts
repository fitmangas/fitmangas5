import type { HealthMetricInput, HealthScores } from './types';

/** Clamp 0–100 */
function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Scores maison indicatifs (NON médicaux).
 * - Régularité : séances / semaine (cible ~3–4)
 * - Récupération : sommeil + FC repos / VFC si connus
 * - Énergie : minutes actives / semaine
 */
export function computeHealthScores(input: HealthMetricInput): HealthScores {
  let regularite = 40;
  if (input.sessionsPerWeek != null) {
    const s = input.sessionsPerWeek;
    if (s <= 0) regularite = 10;
    else if (s < 2) regularite = 35;
    else if (s < 3) regularite = 55;
    else if (s <= 4) regularite = 85;
    else if (s <= 6) regularite = 75;
    else regularite = 60; // sur-sollicitation possible
  }

  let recuperation = 45;
  const parts: number[] = [];
  if (input.sleepHours != null) {
    const h = input.sleepHours;
    if (h < 5) parts.push(20);
    else if (h < 6.5) parts.push(45);
    else if (h <= 8.5) parts.push(90);
    else if (h <= 9.5) parts.push(70);
    else parts.push(50);
  }
  if (input.restingHr != null) {
    const hr = input.restingHr;
    // Indicatif adulte : plus bas souvent mieux (hors pathologie) — NON médical
    if (hr < 50) parts.push(70);
    else if (hr <= 65) parts.push(85);
    else if (hr <= 75) parts.push(65);
    else if (hr <= 85) parts.push(45);
    else parts.push(30);
  }
  if (input.hrvMs != null) {
    const hrv = input.hrvMs;
    if (hrv < 20) parts.push(30);
    else if (hrv < 40) parts.push(50);
    else if (hrv < 70) parts.push(75);
    else parts.push(90);
  }
  if (parts.length) {
    recuperation = parts.reduce((a, b) => a + b, 0) / parts.length;
  }

  let energie = 40;
  if (input.activeMinutes != null) {
    const m = input.activeMinutes;
    if (m < 30) energie = 20;
    else if (m < 75) energie = 40;
    else if (m < 150) energie = 60;
    else if (m < 300) energie = 85;
    else energie = 70;
  }

  return {
    regularite: clamp(regularite),
    recuperation: clamp(recuperation),
    energie: clamp(energie),
  };
}
