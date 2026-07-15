export type ParsedServiceAccount = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

export function hasGoogleServiceAccountJson(): boolean {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  return typeof raw === 'string' && raw.trim().length > 10;
}

export function parseServiceAccountJson(): ParsedServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const client_email = typeof parsed.client_email === 'string' ? parsed.client_email : '';
    const private_key = typeof parsed.private_key === 'string' ? parsed.private_key : '';
    if (!client_email || !private_key) return null;
    return {
      client_email,
      private_key,
      project_id: typeof parsed.project_id === 'string' ? parsed.project_id : undefined,
    };
  } catch {
    return null;
  }
}

export function ga4PropertyResourceName(): string | null {
  const id = process.env.GA4_PROPERTY_ID?.trim() || '537748245';
  if (!/^\d+$/.test(id)) return null;
  return `properties/${id}`;
}
