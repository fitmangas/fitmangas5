/**
 * Cascade texte CM : Anthropic → Gemini (2.5-flash, thinkingBudget:0) → Mistral → Groq.
 * Absent Anthropic = démarrer à Gemini sans erreur bloquante.
 */

export type SocialTextProviderId = 'anthropic' | 'gemini' | 'mistral' | 'groq';

export type SocialTextChatParams = {
  system: string;
  user: string;
  temperature?: number;
  maxOutputTokens?: number;
};

export type SocialTextSuccess = {
  ok: true;
  text: string;
  provider: SocialTextProviderId;
  model: string;
};

export type SocialTextFailure = {
  ok: false;
  provider: SocialTextProviderId;
  reason: string;
  detail?: string;
};

export type SocialTextCascadeResult =
  | (SocialTextSuccess & { attempts: SocialTextFailure[] })
  | { ok: false; reason: 'generation_failed'; detail: string; attempts: SocialTextFailure[] };

export const SOCIAL_TEXT_PROVIDER_ORDER: SocialTextProviderId[] = [
  'anthropic',
  'gemini',
  'mistral',
  'groq',
];

function envTrim(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function getKey(provider: SocialTextProviderId): string | undefined {
  switch (provider) {
    case 'anthropic':
      return envTrim('ANTHROPIC_API_KEY') || envTrim('CLAUDE_API_KEY');
    case 'gemini':
      return envTrim('GEMINI_API_KEY') || envTrim('GOOGLE_GENAI_API_KEY') || envTrim('GOOGLE_API_KEY');
    case 'mistral':
      return envTrim('MISTRAL_API_KEY');
    case 'groq':
      return envTrim('GROQ_API_KEY');
  }
}

function getModel(provider: SocialTextProviderId): string {
  switch (provider) {
    case 'anthropic':
      return envTrim('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-5';
    case 'gemini':
      return envTrim('GEMINI_MODEL') ?? 'gemini-2.5-flash';
    case 'mistral':
      return envTrim('MISTRAL_MODEL') ?? 'mistral-small-latest';
    case 'groq':
      return envTrim('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';
  }
}

export function listConfiguredSocialTextProviders(
  order: SocialTextProviderId[] = SOCIAL_TEXT_PROVIDER_ORDER,
): SocialTextProviderId[] {
  return order.filter((p) => Boolean(getKey(p)));
}

async function completeAnthropic(
  params: SocialTextChatParams,
  apiKey: string,
): Promise<SocialTextSuccess | SocialTextFailure> {
  const model = getModel('anthropic');
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: params.maxOutputTokens ?? 8192,
        temperature: params.temperature ?? 0.5,
        system: params.system,
        messages: [{ role: 'user', content: params.user }],
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        provider: 'anthropic',
        reason: res.status === 429 ? 'quota_exhausted' : 'provider_error',
        detail: `${res.status}: ${body.slice(0, 300)}`,
      };
    }
    const json = JSON.parse(body) as { content?: Array<{ type?: string; text?: string }> };
    const text = (json.content ?? [])
      .filter((c) => c.type === 'text' && c.text)
      .map((c) => c.text!)
      .join('\n')
      .trim();
    if (!text) {
      return { ok: false, provider: 'anthropic', reason: 'invalid_response', detail: 'Réponse Claude vide.' };
    }
    return { ok: true, text, provider: 'anthropic', model };
  } catch (e) {
    return {
      ok: false,
      provider: 'anthropic',
      reason: 'provider_error',
      detail: e instanceof Error ? e.message.slice(0, 400) : String(e),
    };
  }
}

async function completeGemini(
  params: SocialTextChatParams,
  apiKey: string,
): Promise<SocialTextSuccess | SocialTextFailure> {
  const model = getModel('gemini');
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const combined = `${params.system}\n\n${params.user}`;
    const response = await ai.models.generateContent({
      model,
      contents: combined,
      config: {
        temperature: params.temperature ?? 0.5,
        maxOutputTokens: params.maxOutputTokens ?? 8192,
        // thinkingBudget:0 — latence/coût CM (source de vérité)
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    const text = response.text?.trim() ?? '';
    if (!text) {
      return { ok: false, provider: 'gemini', reason: 'invalid_response', detail: 'Réponse Gemini vide.' };
    }
    return { ok: true, text, provider: 'gemini', model };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // Certains modèles refusent thinkingConfig → retry sans
    if (/thinking/i.test(message)) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model,
          contents: `${params.system}\n\n${params.user}`,
          config: {
            temperature: params.temperature ?? 0.5,
            maxOutputTokens: params.maxOutputTokens ?? 8192,
          },
        });
        const text = response.text?.trim() ?? '';
        if (!text) {
          return { ok: false, provider: 'gemini', reason: 'invalid_response', detail: 'Réponse Gemini vide.' };
        }
        return { ok: true, text, provider: 'gemini', model };
      } catch (e2) {
        return {
          ok: false,
          provider: 'gemini',
          reason: 'provider_error',
          detail: e2 instanceof Error ? e2.message.slice(0, 400) : String(e2),
        };
      }
    }
    return {
      ok: false,
      provider: 'gemini',
      reason: /429|quota|RESOURCE_EXHAUSTED/i.test(message) ? 'quota_exhausted' : 'provider_error',
      detail: message.slice(0, 400),
    };
  }
}

async function completeOpenAiCompatible(
  provider: 'mistral' | 'groq',
  params: SocialTextChatParams,
  apiKey: string,
): Promise<SocialTextSuccess | SocialTextFailure> {
  const model = getModel(provider);
  const baseUrl = provider === 'mistral' ? 'https://api.mistral.ai/v1' : 'https://api.groq.com/openai/v1';
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: params.temperature ?? 0.5,
        max_tokens: params.maxOutputTokens ?? 8192,
        messages: [
          { role: 'system', content: params.system },
          { role: 'user', content: params.user },
        ],
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        provider,
        reason: res.status === 429 ? 'quota_exhausted' : 'provider_error',
        detail: `${res.status}: ${body.slice(0, 300)}`,
      };
    }
    const json = JSON.parse(body) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim() ?? '';
    if (!text) {
      return { ok: false, provider, reason: 'invalid_response', detail: 'Réponse vide.' };
    }
    return { ok: true, text, provider, model };
  } catch (e) {
    return {
      ok: false,
      provider,
      reason: 'unavailable',
      detail: e instanceof Error ? e.message.slice(0, 400) : String(e),
    };
  }
}

export async function runSocialTextCascade(
  chat: SocialTextChatParams,
  order: SocialTextProviderId[] = SOCIAL_TEXT_PROVIDER_ORDER,
): Promise<SocialTextCascadeResult> {
  const configured = listConfiguredSocialTextProviders(order);
  const attempts: SocialTextFailure[] = [];

  if (!configured.length) {
    return {
      ok: false,
      reason: 'generation_failed',
      detail:
        'Aucun provider texte configuré (ANTHROPIC_API_KEY / GEMINI_API_KEY / MISTRAL_API_KEY / GROQ_API_KEY).',
      attempts,
    };
  }

  for (const provider of configured) {
    const apiKey = getKey(provider)!;
    let result: SocialTextSuccess | SocialTextFailure;
    if (provider === 'anthropic') result = await completeAnthropic(chat, apiKey);
    else if (provider === 'gemini') result = await completeGemini(chat, apiKey);
    else result = await completeOpenAiCompatible(provider, chat, apiKey);

    if (result.ok) {
      console.info(`[social-text] OK provider=${result.provider} model=${result.model}`);
      return { ...result, attempts };
    }
    attempts.push(result);
    console.warn(`[social-text] échec ${provider}:${result.reason} → suivant`);
  }

  return {
    ok: false,
    reason: 'generation_failed',
    detail: `Génération texte impossible. ${attempts.map((a) => `${a.provider}:${a.reason}`).join(' → ')}`,
    attempts,
  };
}
