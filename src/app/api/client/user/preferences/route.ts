import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/api-auth';
import { createClient } from '@/lib/supabase/server';
import type { BlogLang } from '@/types/blog';

function isLang(v: unknown): v is BlogLang {
  return v === 'fr' || v === 'en' || v === 'es';
}

export async function GET() {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('preferred_blog_language')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Impossible de lire les préférences.' }, { status: 500 });
  }

  const language = isLang(data?.preferred_blog_language) ? data.preferred_blog_language : 'fr';
  return NextResponse.json({ language });
}

export async function PATCH(request: Request) {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 });
  }

  const lang =
    typeof body === 'object' && body !== null && 'language' in body
      ? (body as { language: unknown }).language
      : null;

  if (!isLang(lang)) {
    return NextResponse.json({ error: 'language doit être fr, en ou es.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update({ preferred_blog_language: lang }).eq('id', auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ language: lang });
}
