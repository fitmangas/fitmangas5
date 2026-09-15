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
        ? `${CONCIERGE_OPENING_ES}\n\nPrueba 7 días gratis ✨\nHaz clic aquí para empezar →`
        : `${CONCIERGE_OPENING_FR}\n\nEssai 7 jours gratuits ✨\nClique ici pour démarrer →`,
    trial:
      market === 'mx'
        ? `${CONCIERGE_OPENING_ES}\n\nPrueba 7 días gratis ✨\nTe envío el enlace →`
        : `${CONCIERGE_OPENING_FR}\n\nEssai 7 jours gratuits ✨\nJe t’envoie le lien →`,
    booking:
      market === 'mx'
        ? '¿Prefieres visio colectivo o presencial en Nantes?\n\nDime y te ayudo a reservar.'
        : 'Tu préfères le visio collectif ou le présentiel à Nantes ?\n\nDis-moi, je t’aide à réserver.',
    human:
      market === 'mx'
        ? 'Te respondo yo en persona cuando estás en prueba o suscrita.\n\n¿Empezamos con la prueba 7 días gratis ✨?'
        : 'Je te réponds en personne quand tu es en essai ou abonnée.\n\nOn commence par l’essai 7 jours gratuits ✨ ?',
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
  const prefix = disclosure ? 'Réponse assistée — ' : '';

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
      // Jamais de silence : si Claude tombe, on répond quand même (fallback).
      return fallbackConcierge(params.inboundText, market);
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
  } catch {
    return fallbackConcierge(params.inboundText, market);
  }
}
