import { runSocialTextCascade } from '@/lib/admin/social-text-ai';
import { adaptCaptionToLinkedInDraft } from '@/lib/admin/social-cm-playbook';

/**
 * Adapte une légende IG → LinkedIn via cascade texte CM (Claude → Gemini → …).
 * Échec → needsManual + brouillon marqué, jamais les 3 paragraphes figés.
 */
export async function adaptCaptionToLinkedInViaLlm(source: {
  title: string;
  caption: string;
  cta: string;
  hookTitle?: string;
  locale?: 'fr' | 'es';
}): Promise<{
  title: string;
  caption: string;
  cta: string;
  hashtags: string[];
  needsManual: boolean;
  error?: string;
}> {
  const locale = source.locale ?? 'fr';
  const lang = locale === 'es' ? 'espagnol' : 'français';
  const cascade = await runSocialTextCascade({
    system: `Tu es community manager LinkedIn pour FitMangas (Pilates & Barre en visio).
Réponds UNIQUEMENT en JSON valide : {"title":"...","caption":"...","cta":"...","hashtags":["..."]}.
Légende pro, 2–4 courts paragraphes + question ouverte, ton ${lang}, tutoiement, pas de filler marketing creux.`,
    user: `Adapte ce post vers LinkedIn (${lang}).
Titre: ${source.title}
Hook: ${source.hookTitle || '(vide)'}
Légende source:
${source.caption}
CTA: ${source.cta || 'fitmangas.com'}`,
    temperature: 0.6,
    maxOutputTokens: 1200,
  });

  if (!cascade.ok) {
    const draft = adaptCaptionToLinkedInDraft(source);
    return {
      ...draft,
      needsManual: true,
      error: cascade.detail || 'Adaptation LinkedIn IA échouée — à rédiger manuellement.',
    };
  }

  try {
    const match = cascade.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON LinkedIn introuvable');
    const parsed = JSON.parse(match[0]) as {
      title?: string;
      caption?: string;
      cta?: string;
      hashtags?: string[];
    };
    const caption = String(parsed.caption || '').trim();
    if (caption.length < 80) throw new Error('Légende LinkedIn trop courte');
    return {
      title: String(parsed.title || source.title).trim().slice(0, 120),
      caption: caption.slice(0, 1200),
      cta: String(parsed.cta || source.cta || 'Découvrir FitMangas : fitmangas.com').trim().slice(0, 180),
      hashtags: Array.isArray(parsed.hashtags)
        ? parsed.hashtags.map(String).filter(Boolean).slice(0, 5)
        : ['Pilates', 'BienEtreAuTravail'],
      needsManual: false,
    };
  } catch (e) {
    const draft = adaptCaptionToLinkedInDraft(source);
    return {
      ...draft,
      needsManual: true,
      error: e instanceof Error ? e.message : 'Parse LinkedIn échoué — à rédiger manuellement.',
    };
  }
}
