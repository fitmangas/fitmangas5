/**
 * Cascade IA blog : Gemini → Mistral → Groq → OpenAI (optionnel).
 * Liste ordonnée, facile à réordonner. Chaque provider renvoie le même format texte.
 */

export type BlogAiProviderId = 'gemini' | 'mistral' | 'groq' | 'openai';

export type BlogAiFailureReason =
  | 'no_api_key'
  | 'quota_exhausted'
  | 'provider_error'
  | 'invalid_response'
  | 'unavailable';

export type BlogAiChatParams = {
  system: string;
  user: string;
  temperature?: number;
  maxOutputTokens?: number;
};

export type BlogAiChatSuccess = {
  ok: true;
  text: string;
  provider: BlogAiProviderId;
  model: string;
};

export type BlogAiChatFailure = {
  ok: false;
  provider: BlogAiProviderId;
  reason: BlogAiFailureReason;
  detail?: string;
};

export type BlogAiCascadeResult =
  | (BlogAiChatSuccess & { attempts: BlogAiChatFailure[] })
  | {
      ok: false;
      reason: 'generation_failed';
      detail: string;
      attempts: BlogAiChatFailure[];
    };

/** Ordre de bascule — modifier ici pour réordonner. */
export const BLOG_AI_PROVIDER_ORDER: BlogAiProviderId[] = ['gemini', 'mistral', 'groq', 'openai'];

function envTrim(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getProviderApiKey(provider: BlogAiProviderId): string | undefined {
  switch (provider) {
    case 'gemini':
      return envTrim('GEMINI_API_KEY') || envTrim('GOOGLE_GENAI_API_KEY') || envTrim('GOOGLE_API_KEY');
    case 'mistral':
      return envTrim('MISTRAL_API_KEY');
    case 'groq':
      return envTrim('GROQ_API_KEY');
    case 'openai':
      return envTrim('OPENAI_API_KEY');
  }
}

export function getProviderModel(provider: BlogAiProviderId): string {
  switch (provider) {
    case 'gemini':
      return envTrim('GEMINI_MODEL') ?? 'gemini-2.0-flash';
    case 'mistral':
      return envTrim('MISTRAL_MODEL') ?? 'mistral-small-latest';
    case 'groq':
      return envTrim('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';
    case 'openai':
      return envTrim('OPENAI_MODEL') ?? 'gpt-4o-mini';
  }
}

export function listConfiguredBlogAiProviders(
  order: BlogAiProviderId[] = BLOG_AI_PROVIDER_ORDER,
): BlogAiProviderId[] {
  return order.filter((provider) => Boolean(getProviderApiKey(provider)));
}

function isQuotaMessage(message: string, status?: number): boolean {
  if (status === 429) return true;
  return (
    /RESOURCE_EXHAUSTED|quota|rate.?limit|too many requests/i.test(message) ||
    message.includes('429')
  );
}

function isUnavailableMessage(message: string, status?: number): boolean {
  if (status === 503 || status === 502) return true;
  return /UNAVAILABLE|high demand|overloaded|temporarily/i.test(message);
}

async function completeWithGemini(
  params: BlogAiChatParams,
  apiKey: string,
): Promise<BlogAiChatSuccess | BlogAiChatFailure> {
  const model = getProviderModel('gemini');
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const combined = `${params.system}\n\n${params.user}\n\nRéponds uniquement avec le format demandé, sans markdown ni texte avant ou après.`;
    const response = await ai.models.generateContent({
      model,
      contents: combined,
      config: {
        temperature: params.temperature ?? 0.7,
        maxOutputTokens: params.maxOutputTokens ?? 4096,
      },
    });
    const text = response.text?.trim() ?? '';
    if (!text) {
      return { ok: false, provider: 'gemini', reason: 'invalid_response', detail: 'Réponse Gemini vide.' };
    }
    return { ok: true, text, provider: 'gemini', model };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[blog-ai] Gemini', message.slice(0, 400));
    if (isQuotaMessage(message)) {
      return { ok: false, provider: 'gemini', reason: 'quota_exhausted', detail: message.slice(0, 400) };
    }
    if (isUnavailableMessage(message)) {
      return { ok: false, provider: 'gemini', reason: 'unavailable', detail: message.slice(0, 400) };
    }
    return { ok: false, provider: 'gemini', reason: 'provider_error', detail: message.slice(0, 400) };
  }
}

async function completeOpenAiCompatible(params: {
  provider: Exclude<BlogAiProviderId, 'gemini'>;
  baseUrl: string;
  apiKey: string;
  chat: BlogAiChatParams;
}): Promise<BlogAiChatSuccess | BlogAiChatFailure> {
  const model = getProviderModel(params.provider);
  try {
    const response = await fetch(`${params.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: params.chat.temperature ?? 0.7,
        max_tokens: params.chat.maxOutputTokens ?? 4096,
        messages: [
          { role: 'system', content: params.chat.system },
          { role: 'user', content: params.chat.user },
        ],
      }),
    });
    const body = await response.text();
    if (!response.ok) {
      console.error(`[blog-ai] ${params.provider}`, response.status, body.slice(0, 400));
      if (isQuotaMessage(body, response.status)) {
        return {
          ok: false,
          provider: params.provider,
          reason: 'quota_exhausted',
          detail: `${response.status}: ${body.slice(0, 300)}`,
        };
      }
      if (isUnavailableMessage(body, response.status)) {
        return {
          ok: false,
          provider: params.provider,
          reason: 'unavailable',
          detail: `${response.status}: ${body.slice(0, 300)}`,
        };
      }
      return {
        ok: false,
        provider: params.provider,
        reason: 'provider_error',
        detail: `${response.status}: ${body.slice(0, 300)}`,
      };
    }
    let json: { choices?: Array<{ message?: { content?: string } }> };
    try {
      json = JSON.parse(body) as typeof json;
    } catch {
      return {
        ok: false,
        provider: params.provider,
        reason: 'invalid_response',
        detail: 'JSON de réponse invalide.',
      };
    }
    const text = json.choices?.[0]?.message?.content?.trim() ?? '';
    if (!text) {
      return {
        ok: false,
        provider: params.provider,
        reason: 'invalid_response',
        detail: 'Réponse vide.',
      };
    }
    return { ok: true, text, provider: params.provider, model };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[blog-ai] ${params.provider}`, message.slice(0, 400));
    // Région / réseau inaccessible (ex. Groq) → continuer la cascade proprement
    return {
      ok: false,
      provider: params.provider,
      reason: 'unavailable',
      detail: message.slice(0, 400),
    };
  }
}

export async function completeWithProvider(
  provider: BlogAiProviderId,
  chat: BlogAiChatParams,
): Promise<BlogAiChatSuccess | BlogAiChatFailure> {
  const apiKey = getProviderApiKey(provider);
  if (!apiKey) {
    return { ok: false, provider, reason: 'no_api_key', detail: `Clé absente pour ${provider}.` };
  }

  switch (provider) {
    case 'gemini':
      return completeWithGemini(chat, apiKey);
    case 'mistral':
      return completeOpenAiCompatible({
        provider: 'mistral',
        baseUrl: 'https://api.mistral.ai/v1',
        apiKey,
        chat,
      });
    case 'groq':
      return completeOpenAiCompatible({
        provider: 'groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKey,
        chat,
      });
    case 'openai':
      return completeOpenAiCompatible({
        provider: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKey,
        chat,
      });
  }
}

/**
 * Enchaîne les providers configurés jusqu'au premier succès.
 * Ne retente pas longuement Gemini (bascule immédiate vers le suivant).
 */
export async function runBlogAiCascade(
  chat: BlogAiChatParams,
  order: BlogAiProviderId[] = BLOG_AI_PROVIDER_ORDER,
): Promise<BlogAiCascadeResult> {
  const configured = listConfiguredBlogAiProviders(order);
  const attempts: BlogAiChatFailure[] = [];

  if (configured.length === 0) {
    return {
      ok: false,
      reason: 'generation_failed',
      detail: 'Aucune clé IA configurée (GEMINI / MISTRAL / GROQ / OPENAI).',
      attempts,
    };
  }

  for (const provider of configured) {
    const result = await completeWithProvider(provider, chat);
    if (result.ok) {
      console.info(`[blog-ai] OK provider=${result.provider} model=${result.model}`);
      return { ...result, attempts };
    }
    attempts.push(result);
    console.warn(
      `[blog-ai] échec provider=${provider} reason=${result.reason} → bascule suivante`,
    );
  }

  return {
    ok: false,
    reason: 'generation_failed',
    detail: `Tous les providers ont échoué (${attempts.map((a) => `${a.provider}:${a.reason}`).join(', ')}).`,
    attempts,
  };
}
