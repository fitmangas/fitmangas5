import { CONCIERGE_OPENING_ES, CONCIERGE_OPENING_FR, CONCIERGE_SYSTEM_PROMPT, isAiDisclosureEnabled } from '@/lib/acquisition/config';

export type ConciergeIntent = 'info' | 'trial' | 'booking' | 'human' | 'optout';

export type ConciergeResult =
  | {
      ok: true;
      intent: ConciergeIntent;
      reply: string;
      suggestedActions: string[];
      provider: 'anthropic' | 'fallback';
    }
  | { ok: false; error: string };

function fallbackConcierge(inboundText: string, market: 'fr' | 'mx'): ConciergeResult {
  const lower = inboundText.toLowerCase();
  let intent: ConciergeIntent = 'info';
  if (/essai|gratuit|prix|abon|trial|prueba/.test(lower)) intent = 'trial';
  if (/cours|horaire|réserver|reserv|nantes|visio/.test(lower)) intent = 'booking';
  if (/humain|alejandra|appel|téléphone|telefono/.test(lower)) intent = 'human';

  const replies: Record<ConciergeIntent, string> = {
    info:
      market === 'mx'
        ? `${CONCIERGE_OPENING_ES} ¿Te interesa probar 7 días gratis?`
        : `${CONCIERGE_OPENING_FR} Tu veux tester l’essai 7 jours ?`,
    trial:
      market === 'mx'
        ? `${CONCIERGE_OPENING_ES} Te envío el enlace de prueba 7 días — tarjeta solo al final si sigues.`
        : `${CONCIERGE_OPENING_FR} Je t’envoie le lien d’essai 7 jours — carte demandée seulement à la fin si tu continues.`,
    booking:
      market === 'mx'
        ? '¿Prefieres visio colectivo o presencial en Nantes? Te ayudo a reservar un hueco.'
        : 'Tu préfères le visio collectif ou le présentiel à Nantes ? Je note ta demande de créneau.',
    human:
      market === 'mx'
        ? 'Alejandra responde personalmente a las clientas en prueba o suscritas. ¿Quieres empezar con la prueba 7 días?'
        : 'Alejandra répond en direct aux clientes en essai ou abonnées. Tu veux commencer par l’essai 7 jours ?',
    optout: market === 'mx' ? 'Entendido, no te escribo más.' : 'Compris, je ne t’écris plus.',
  };

  const suggested: Record<ConciergeIntent, string[]> = {
    info: ['send_trial_link'],
    trial: ['send_trial_link', 'capture_email_optin'],
    booking: ['book_session_intent'],
    human: ['send_trial_link'],
    optout: [],
  };

  return {
    ok: true,
    intent,
    reply: replies[intent],
    suggestedActions: suggested[intent],
    provider: 'fallback',
  };
}

function parseConciergeJson(text: string): ConciergeResult | null {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const json = JSON.parse(match[0]) as {
      intent?: string;
      reply?: string;
      suggestedActions?: string[];
    };
    const intent = (json.intent ?? 'info') as ConciergeIntent;
    if (!json.reply?.trim()) return null;
    return {
      ok: true,
      intent,
      reply: json.reply.trim(),
      suggestedActions: Array.isArray(json.suggestedActions) ? json.suggestedActions.map(String) : [],
      provider: 'anthropic',
    };
  } catch {
    return null;
  }
}

export async function runConcierge(params: {
  inboundText: string;
  market?: 'fr' | 'mx';
}): Promise<ConciergeResult> {
  const market = params.market ?? 'fr';
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim() || process.env.CLAUDE_API_KEY?.trim();
  if (!apiKey) {
    return fallbackConcierge(params.inboundText, market);
  }

  const disclosure = isAiDisclosureEnabled(market);
  const prefix = disclosure ? 'Assistant IA FitMangas — ' : '';

  try {
    const model = process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-5';
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        temperature: 0.4,
        system: CONCIERGE_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Marché: ${market}. Message entrant: """${params.inboundText.slice(0, 2000)}"""`,
          },
        ],
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        error: `Claude indisponible (${res.status}) — ${body.slice(0, 200)}`,
      };
    }
    const json = JSON.parse(body) as { content?: Array<{ type?: string; text?: string }> };
    const text = (json.content ?? [])
      .filter((c) => c.type === 'text')
      .map((c) => c.text ?? '')
      .join('\n');
    const parsed = parseConciergeJson(text);
    if (!parsed || !parsed.ok) {
      return fallbackConcierge(params.inboundText, market);
    }
    if (prefix) parsed.reply = prefix + parsed.reply;
    return parsed;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erreur concierge IA',
    };
  }
}
