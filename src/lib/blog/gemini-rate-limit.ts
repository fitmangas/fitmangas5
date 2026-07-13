/** Pause entre appels Gemini pour rester sous 5 requêtes/minute (quota gratuit). */
export const GEMINI_MIN_INTERVAL_MS = 13_000;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GeminiRateLimiter {
  private lastCallAt = 0;

  async waitTurn(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastCallAt;
    if (this.lastCallAt > 0 && elapsed < GEMINI_MIN_INTERVAL_MS) {
      await sleep(GEMINI_MIN_INTERVAL_MS - elapsed);
    }
    this.lastCallAt = Date.now();
  }
}
