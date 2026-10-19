import {
  CONCIERGE_OPENING_ES,
  CONCIERGE_OPENING_FR,
  conciergeSystemPrompt,
  isAiDisclosureEnabled,
} from '@/lib/acquisition/config';
import { isCroissanceV2Enabled } from '@/lib/acquisition/croissance-v2-flag';
import { commonF } from '@/lib/acquisition/engine/croissance-v2-copy';
import { softDeclineReplyEs, softDeclineReplyFr } from '@/lib/acquisition/engine/soft-decline';
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

  const optoutRe = isCroissanceV2Enabled()
    ? /\bstop\b|^\s*¡?(basta|arr[êe]te|no m[áa]s)\s*[.!]*\s*$|d[ée]sabonne-moi|me d[ée]sabonner|d[ée]sinscris-moi|me d[ée]sinscrire|unsubscribe|ne m['’][ée]cris plus|arr[êe]te de m['’][ée]crire|arr[êe]te les messages|no me escribas|no m[áa]s mensajes|ya basta|basta ya/i
    : /stop|désabonne|desabonne|unsubscribe|no más|no mas|basta|arrête|arrete|no me escribas/;
  if (optoutRe.test(inboundText)) {
    return {
      ok: true,
      intent: 'optout',
      reply: isCroissanceV2Enabled()
        ? commonF(market === 'mx' ? 'es' : 'fr')
        : market === 'mx'
          ? 'Entendido, no te escribo más.'
          : 'Compris, je ne t’écris plus.',
      suggestedActions: [],
      provider: 'fallback',
    };
  }

  if (isSoftDeclineText(inboundText)) {
    return {
      ok: true,
      intent: 'soft_decline',
      reply: market === 'mx' ? softDeclineReplyEs() : softDeclineReplyFr(),
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
  const v2 = isCroissanceV2Enabled();
  const replies: Record<ConciergeIntent, string> = {
    info: v2
      ? market === 'mx'
        ? `${CONCIERGE_OPENING_ES}\n\n¿Qué te trae por aquí? ¿Las clases, los precios u otra cosa?`
        : `${CONCIERGE_OPENING_FR}\n\nDis-moi ce qui t’amène : les cours, les prix ou autre chose ?`
      : market === 'mx'
        ? `${CONCIERGE_OPENING_ES}\n\nDime qué te trae por aquí 💛 ¿Una duda sobre las clases, el precio, o algo más?`
        : `${CONCIERGE_OPENING_FR}\n\nDis-moi ce qui t’amène 💛 Une question sur les cours, le prix, ou autre chose ?`,
    trial: v2
      ? market === 'mx'
        ? `${CONCIERGE_OPENING_ES}\nCon gusto: te mando enseguida el enlace de la prueba de 7 días gratis.`
        : `${CONCIERGE_OPENING_FR}\nAvec plaisir : je t’envoie le lien de l’essai 7 jours gratuits juste après.`
      : market === 'mx'
        ? `${CONCIERGE_OPENING_ES}\n\nPrueba 7 días gratis ✨\nTe envío el enlace →`
        : `${CONCIERGE_OPENING_FR}\n\nEssai 7 jours gratuits ✨\nJe t’envoie le lien →`,
    booking: v2
      ? market === 'mx'
        ? 'Con gusto 💛\nLas clases en grupo son en línea. Si es para Nantes, te respondo personalmente.'
        : 'Avec plaisir 💛\nLes cours en groupe sont en visio. Pour les cours à Nantes, je te réponds personnellement.'
      : market === 'mx'
        ? '¿Prefieres visio colectivo o presencial en Nantes?\n\nDime y te ayudo.'
        : 'Tu préfères le visio collectif ou le présentiel à Nantes ?\n\nDis-moi, je t’aide.',
    human: v2
      ? market === 'mx'
        ? 'Te leo 💛\nCuéntame, te respondo por aquí.'
        : 'Je te lis 💛\nDis-moi tout, je te réponds ici.'
      : market === 'mx'
        ? 'Te leo 💛 Cuéntame con calma — te ayudo.'
        : 'Je te lis 💛 Dis-moi tranquillement — je t’aide.',
    optout: v2
      ? commonF(market === 'mx' ? 'es' : 'fr')
      : market === 'mx'
        ? 'Entendido, no te escribo más.'
        : 'Compris, je ne t’écris plus.',
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
    booking:
      v2 && /nantes|pr[ée]sentiel|presentiel|sur place/.test(lower) ? ['escalate_human'] : ['book_session_intent'],
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
        system: conciergeSystemPrompt(),
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
