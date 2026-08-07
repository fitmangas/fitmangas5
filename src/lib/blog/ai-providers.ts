/**
 * Cascade IA blog : Claude → Gemini → Mistral → Groq → OpenAI (optionnel).
 * Liste ordonnée, facile à réordonner. Chaque provider renvoie le même format texte.
 */

export type BlogAiProviderId = 'claude' | 'gemini' | 'mistral' | 'groq' | 'openai';

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

/** Ordre de bascule — Claude primaire (CHEMIN B source de vérité). */
export const BLOG_AI_PROVIDER_ORDER: BlogAiProviderId[] = [
  'claude',
  'gemini',
  'mistral',
  'groq',
  'openai',
];

function envTrim(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getProviderApiKey(provider: BlogAiProviderId): string | undefined {
  switch (provider) {
    case 'claude':
      return envTrim('ANTHROPIC_API_KEY');
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
    case 'claude':
      return envTrim('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-5';
    case 'gemini':
      return envTrim('GEMINI_MODEL') ?? 'gemini-2.5-flash';
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

async function completeWithClaude(
  params: BlogAiChatParams,
  apiKey: string,
): Promise<BlogAiChatSuccess | BlogAiChatFailure> {
  const model = getProviderModel('claude');
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: params.maxOutputTokens ?? 8192,
        temperature: params.temperature ?? 0.7,
        system: params.system,
        messages: [{ role: 'user', content: params.user }],
      }),
    });
    const body = await response.text();
    if (!response.ok) {
      console.error('[blog-ai] Claude', response.status, body.slice(0, 400));
      if (isQuotaMessage(body, response.status)) {
        return {
          ok: false,
          provider: 'claude',
          reason: 'quota_exhausted',
          detail: `${response.status}: ${body.slice(0, 300)}`,
        };
      }
      return {
        ok: false,
        provider: 'claude',
        reason: 'provider_error',
        detail: `${response.status}: ${body.slice(0, 300)}`,
      };
    }
    let json: { content?: Array<{ type?: string; text?: string }> };
    try {
      json = JSON.parse(body) as typeof json;
    } catch {
      return { ok: false, provider: 'claude', reason: 'invalid_response', detail: 'JSON Claude invalide.' };
    }
    const text = (json.content ?? [])
      .filter((block) => block.type === 'text' && block.text)
      .map((block) => block.text!)
      .join('\n')
      .trim();
    if (!text) {
      return { ok: false, provider: 'claude', reason: 'invalid_response', detail: 'Réponse Claude vide.' };
    }
    return { ok: true, text, provider: 'claude', model };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[blog-ai] Claude', message.slice(0, 400));
    return { ok: false, provider: 'claude', reason: 'provider_error', detail: message.slice(0, 400) };
  }
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
        ...(model.includes('flash') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
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
  provider: Exclude<BlogAiProviderId, 'gemini' | 'claude'>;
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
    case 'claude':
      return completeWithClaude(chat, apiKey);
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
 * Absent Anthropic = démarrer à Gemini sans erreur bloquante.
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
      detail: 'Aucune clé IA configurée (ANTHROPIC / GEMINI / MISTRAL / GROQ / OPENAI).',
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
