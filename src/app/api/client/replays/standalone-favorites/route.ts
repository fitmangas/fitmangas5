import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { videoId?: string; favorite?: boolean } | null;
  const videoId = body?.videoId?.trim();
  const favorite = body?.favorite === true;
  if (!videoId) return NextResponse.json({ error: 'videoId manquant.' }, { status: 400 });

  if (favorite) {
    const { error } = await supabase.from('standalone_vimeo_favorites').insert({ video_id: videoId, user_id: user.id });
    if (error && !error.message.includes('duplicate key')) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, favorite: true });
  }

  const { error } = await supabase.from('standalone_vimeo_favorites').delete().eq('video_id', videoId).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, favorite: false });
}
