import {
  CONCIERGE_OPENING_ES,
  CONCIERGE_OPENING_FR,
  CONCIERGE_SYSTEM_PROMPT,
  isAiDisclosureEnabled,
} from '@/lib/acquisition/config';
import {
  classifyConversationIntent,
  replyForIntent,
} from '@/lib/acquisition/engine/conversation-intents';
import { isSoftDeclineText } from '@/lib/acquisition/engine/soft-decline';

export type ConciergeIntent =
  | 'info'
  | 'trial'
  | 'booking'
  | 'human'
  | 'optout'
  | 'soft_decline'
  | 'thinking'
  | 'factual'
  | 'support'
  | 'warm_no_intent'
  | 'offtopic';

export type ConciergeResult =
  | {
      ok: true;
      intent: ConciergeIntent;
      reply: string;
      suggestedActions: string[];
      provider: 'anthropic' | 'fallback';
    }
  | { ok: false; error: string };

const NO_PITCH_INTENTS: ConciergeIntent[] = [
  'soft_decline',
  'optout',
  'thinking',
  'support',
  'warm_no_intent',
  'offtopic',
  'factual',
];

function fallbackConcierge(inboundText: string, market: 'fr' | 'mx'): ConciergeResult {
  const lower = inboundText.toLowerCase();

  if (/stop|désabonne|desabonne|unsubscribe|no más|no mas|basta|arrête|arrete|no me escribas/.test(lower)) {
    return {
      ok: true,
      intent: 'optout',
      reply: market === 'mx' ? 'Entendido, no te escribo más.' : 'Compris, je ne t’écris plus.',
      suggestedActions: [],
      provider: 'fallback',
    };
  }

  if (isSoftDeclineText(inboundText)) {
    return {
      ok: true,
      intent: 'soft_decline',
      reply:
        market === 'mx'
          ? 'Gracias por tu sinceridad 💛\n\nTe deseo lo mejor donde estés. Si un día quieres probar conmigo, estaré aquí — sin presión.'
          : 'Merci pour ta sincérité 💛\n\nJe te souhaite une belle continuation là où tu es. Si un jour tu as envie d’essayer avec moi, je serai là — sans pression.',
      suggestedActions: [],
      provider: 'fallback',
    };
  }

  const classified = classifyConversationIntent(inboundText);
  if (classified) {
    const mapIntent: Record<string, ConciergeIntent> = {
      thinking: 'thinking',
      factual_price: 'factual',
      factual_schedule: 'factual',
      factual_replay: 'factual',
      factual_how: 'factual',
      trial_offer: 'trial',
      support: 'support',
      warm_no_intent: 'warm_no_intent',
      offtopic: 'offtopic',
    };
    const intent = mapIntent[classified] ?? 'info';
    const packed = replyForIntent(classified, market);
    return {
      ok: true,
      intent,
      reply: packed.body,
      suggestedActions: packed.appendTrialLink ? ['send_trial_link'] : [],
      provider: 'fallback',
    };
  }

  let intent: ConciergeIntent = 'info';
  if (/essai|prueba|trial/.test(lower)) {
    intent = 'trial';
  } else if (/cours|horaire|réserver|reserv|nantes|visio/.test(lower)) {
    intent = 'booking';
  } else if (/humain|alejandra|appel|téléphone|telefono/.test(lower)) {
    intent = 'human';
  }

  // Catch-all adouci : converses d’abord, pas de pitch / email immédiat
  const replies: Record<ConciergeIntent, string> = {
    info:
      market === 'mx'
        ? `${CONCIERGE_OPENING_ES}\n\nDime qué te trae por aquí 💛 ¿Una duda sobre las clases, el precio, o algo más?`
        : `${CONCIERGE_OPENING_FR}\n\nDis-moi ce qui t’amène 💛 Une question sur les cours, le prix, ou autre chose ?`,
    trial:
      market === 'mx'
        ? `${CONCIERGE_OPENING_ES}\n\nPrueba 7 días gratis ✨\nTe envío el enlace →`
        : `${CONCIERGE_OPENING_FR}\n\nEssai 7 jours gratuits ✨\nJe t’envoie le lien →`,
    booking:
      market === 'mx'
        ? '¿Prefieres visio colectivo o presencial en Nantes?\n\nDime y te ayudo.'
        : 'Tu préfères le visio collectif ou le présentiel à Nantes ?\n\nDis-moi, je t’aide.',
    human:
      market === 'mx'
        ? 'Te leo 💛 Cuéntame con calma — te ayudo.'
        : 'Je te lis 💛 Dis-moi tranquillement — je t’aide.',
    optout: market === 'mx' ? 'Entendido, no te escribo más.' : 'Compris, je ne t’écris plus.',
    soft_decline:
      market === 'mx'
        ? 'Gracias por tu sinceridad 💛\n\nTe deseo lo mejor donde estés.'
        : 'Merci pour ta sincérité 💛\n\nJe te souhaite une belle continuation.',
    thinking: replyForIntent('thinking', market).body,
    factual: replyForIntent('factual_how', market).body,
    support: replyForIntent('support', market).body,
    warm_no_intent: replyForIntent('warm_no_intent', market).body,
    offtopic: replyForIntent('offtopic', market).body,
  };

  const suggested: Record<ConciergeIntent, string[]> = {
    info: [],
    trial: ['send_trial_link'],
    booking: ['book_session_intent'],
    human: [],
    optout: [],
    soft_decline: [],
    thinking: [],
    factual: [],
    support: [],
    warm_no_intent: [],
    offtopic: [],
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
    const rawIntent = (json.intent ?? 'info') as string;
    const intent = (
      rawIntent === 'decline' ? 'soft_decline' : rawIntent
    ) as ConciergeIntent;
    if (!json.reply?.trim()) return null;
    const suggestedActions = Array.isArray(json.suggestedActions)
      ? json.suggestedActions.map(String)
      : [];
    return {
      ok: true,
      intent,
      reply: json.reply.trim(),
      suggestedActions: NO_PITCH_INTENTS.includes(intent)
        ? suggestedActions.filter(
            (s) =>
              !/trial|email|capture/i.test(s),
          )
        : suggestedActions,
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
  if (isSoftDeclineText(params.inboundText) || classifyConversationIntent(params.inboundText)) {
    return fallbackConcierge(params.inboundText, market);
  }

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
    if (NO_PITCH_INTENTS.includes(parsed.intent)) {
      parsed.suggestedActions = [];
    }
    if (prefix) parsed.reply = prefix + parsed.reply;
    return parsed;
  } catch {
    return fallbackConcierge(params.inboundText, market);
  }
}
