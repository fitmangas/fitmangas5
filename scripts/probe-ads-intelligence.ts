/**
 * Probe sync intelligence Ads + organique (lecture seule).
 * Usage: npx tsx scripts/probe-ads-intelligence.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    }
  } catch {
    /* ignore */
  }
}

loadEnvLocal();

async function main() {
  const { runAdsIntelligenceSync } = await import('../src/lib/acquisition/ads/sync-intelligence');
  const r = await runAdsIntelligenceSync('probe');
  console.log(
    JSON.stringify(
      {
        ok: r.ok,
        adsOk: r.adsOk,
        organicOk: r.organicOk,
        insightsRows: r.detail.insightsRows,
        breakdownRows: r.detail.breakdownRows,
        organicMedia: r.detail.organicMedia,
        capabilities: r.detail.capabilities.map((c) => ({
          id: c.id,
          ok: c.accessible,
          missing: c.missingPermission,
        })),
        errors: r.detail.errors.slice(0, 12),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
