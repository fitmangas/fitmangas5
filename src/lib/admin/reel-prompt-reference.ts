/**
 * Prompt Claude Code figé — standard Reel validé (dolor-espalda + trop-tard).
 * Source : FitMangas-Reels/PROMPT-REFERENCE.md — sans punch-in (coach n’aime pas).
 */

export const TEMPLATE_REFERENCE = `Monte un nouveau Reel FitMangas au STANDARD VALIDÉ (réf. dolor-espalda + trop-tard).
Ne me redemande pas le style : il est figé dans mes fichiers.

AVANT TOUT — lis et applique STRICTEMENT, dans l'ordre :
1. FitMangas-Reels/STRATEGY.md
2. TOUS les FitMangas-Reels/skills/ (01-derush → 08-audio) — surtout 03 (motion LMDM)
4. Ta mémoire « Standard de production FitMangas »

════════ ENTRÉES (les SEULS éléments variables) ════════
- Vidéo brute .................. {{CHEMIN_MP4}}
- Langue parlée ................ {{LANGUE}}
- Hook (gros titre 0–2,8 s) .... {{HOOK}}   (toujours affiché même si non prononcé)
- 3 idées / sujet du brief ..... {{IDEE_1}} | {{IDEE_2}} | {{IDEE_3}}   (intention, PAS la source des sous-titres)
- Légende Instagram ............ {{LEGENDE}}   (ou « génère-la » : 70–150 car. + 3–5 hashtags, sur ce qui est VRAIMENT dit)
- Overlay / exception .......... {{OVERLAY_OU_EXCEPTION}}   (sinon : standard)

════════ PIPELINE (FIXE) ════════
1. Projet HyperFrames « reel-{{SLUG}} », portrait 1080×1920.
2. COULEURS : si HDR/HLG ou Log → VRAI tonemap SDR Rec.709 via LUT \`assets/hlg2709.cube\` + \`lut3d\`
   (jamais un retag ; jamais un grade « curves »). Si la prise est sombre, RELEVER l'expo :
   \`curves\` shadow-lift + \`eq\` après le LUT (visage bien éclairé, noirs conservés). cara.mp4 taggé bt709.
3. DÉRUSH : Whisper LOCAL ({{LANGUE}}) → voix RÉELLE ; couper dans les silences MESURÉS ; garder ~60–90 s
   cohérents (problème → solution → accompagnement → CTA), couper répétitions/hésitations. C'est TOI qui
   décides quoi garder, sans me demander. Concat des blocs gardés.
4. SOUS-TITRES = ce qu'elle DIT (verbatim, accent authentique assumé). Retouche « légère » UNIQUEMENT si
   une phrase n'a vraiment aucun sens. Style INTANGIBLE : Inter 800, 74 px, blanc + contour noir 6 px,
   mot-clé terracotta #e8894f, 2–3 mots, fins fortes. Conteneur unique + autoAlpha (seek-safe).
5. HOOK : gros titre blanc+contour noir tiers sup. + logo flamme PNG TRANSPARENT dessous (pas de pastille).
6. MOTION LMDM — LE CŒUR (skill 03). Passe la transcription PHRASE PAR PHRASE : à CHAQUE phrase un beat
   visuel, aucune phrase sans rien.
   - Grosses animations (2–4) en SPLIT SCREEN plein largeur : zone haute = fond DÉDIÉ bord à bord
     (#1a1a1a sombre ou cream selon l'animation, jamais une petite carte flottante), animation GRANDE
     et lisible ; visage recadré moitié basse (clip-path inset 48% + translateY, seek-safe) ; sous-titres
     déplacés à la JONCTION des deux zones pendant le split, remis en bas après. Entrée/sortie = CUT SEC
     (tl.set instantané, jamais de fondu de zone). Occasionnellement l'animation peut prendre l'écran
     ENTIER quelques secondes (la personne disparaît), puis retour cut sec au face cam.
   - Majorité de MICRO-animations qui VIVENT (une par phrase, entre les splits) : soulignement terracotta
     qui se dessine sous un mot-clé du sous-titre au moment où il est dit, cercle/pictogramme qui pop à
     côté d'elle, checklist qui se coche item par item, éléments qui glissent/s'alignent.
   - INTERDIT : gros texte qui répète/résume la voix (hors hook+sous-titres — c'est l'erreur n°1 LMDM,
     la même info 3 fois) ; wipes/volets/sweeps colorés (CUT SEC uniquement, jamais de transition
     diagonale ou colorée) ; ZOOM punch-in sur la personne (la coach n'aime pas cette action — jamais
     de scale sur le visage). Templates catalog HyperFrames en priorité, rebrand cream/terracotta ;
     from scratch sinon, toujours en décrivant le mouvement (quoi bouge, ordre, timing, accent) avant de coder.
7. BLOCK INSTAGRAM FOLLOW (standard, ~4,5 s avant le CTA) : avatar crop CARRÉ centré visage \`hero.jpg\`,
   FitMangas + badge vérifié BLEU, @fit.mangas, bouton « Seguir » FIXE, « Pilates · Barre en vivo ».
8. CTA = PILE 3 CARTES desktop en zone sombre haute (dashboard centre / blog gauche / replays droite),
   lockup pastille+logo + pill fitmangas.com, visage recadré bas. Jamais de screenshot mobile plein cadre.
9. AUDIO :
   - Voix STABLE ~−16 dB de bout en bout. Débruitage MINIMAL (highpass + loudnorm) — JAMAIS \`arnndn\`/RNNoise,
     JAMAIS \`anlmdn\` (effet « tunnel/caverneux »). Vérifier RMS par fenêtres.
   - Musique = bed LOUNGE très léger (~−15 dB sous la voix, presque subliminal), fondu d'entrée court,
     fondu de sortie seulement en toute fin.
   - SFX = palette VARIÉE PAR TYPE d'élément (skill 05), jamais juste des whoosh : clic de souris
     (apparition UI/carte/split), frappe clavier (texte qui s'écrit), obturateur photo (apparition
     d'image si dispo), tick (chaque coche de checklist), pop discret (picto), chime/ping léger
     (soulignement), whoosh (Follow/CTA uniquement). Chaque animation a son micro-son ~−20 dB sous
     la voix (sons fins un peu plus haut si besoin). Pas d'animation muette.
   - Exception « son d'origine seul » si {{OVERLAY_OU_EXCEPTION}} le demande (voix brute -16, aucun musique/SFX).
10. \`npm run check\` = 0 erreur. Snapshots de PREUVE à chaque étape (couleurs, hook, chaque animation, Follow, CTA).
11. Studio localhost (\`npm run dev\`), ATTENDS mon OK visuel. Sur mon OK : \`npm run render\` LOCAL (jamais cloud) →
    copie H.264 SDR Rec.709 (bt709, faststart, audio inchangé) dans le VRAI dossier local
    FitMangas-Reels/exports/ : « reel-{{SLUG}}_1080x1920_30fps.mp4 ». Donne le chemin.
12. Propose la légende. Zones mortes IG respectées (150/400/100 px). Face cam dominant.`;

export type ReelPromptTokenMap = {
  CHEMIN_MP4: string;
  SLUG: string;
  LANGUE: string;
  HOOK: string;
  IDEE_1: string;
  IDEE_2: string;
  IDEE_3: string;
  LEGENDE: string;
  OVERLAY_OU_EXCEPTION: string;
};

export type ReelPromptPostFields = {
  hookTitle?: string | null;
  overlayText?: string | null;
  title?: string | null;
  reelScript?: string | null;
  caption?: string | null;
  locale?: string | null;
  rawVideoPath?: string | null;
  /** Exception audio / overlay (ex. « son d'origine seul »). Vide → standard. */
  overlayOrException?: string | null;
};

/** dolor-espalda-oficina-es.MOV → dolor-espalda */
export function slugFromMp4Filename(pathOrName: string | null | undefined): string {
  if (!pathOrName?.trim()) return '';
  const base = pathOrName.trim().split(/[/\\]/).pop() || '';
  const withoutExt = base.replace(/\.(mp4|mov|webm|m4v)$/i, '');
  const noLocale = withoutExt.replace(/[-_](fr|es|en|fr-FR|es-ES|es-MX)$/i, '');
  const parts = noLocale
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return parts.slice(0, 2).join('-');
}

/** Extrait jusqu’à 3 idées du brief tournage (numérotées ou puces). */
export function extractReelIdeas(reelScript: string | null | undefined): [string, string, string] {
  const empty: [string, string, string] = ['', '', ''];
  const text = asText(reelScript).trim();
  if (!text) return empty;

  // Section avant BRIEF si présente
  const beforeBrief = text.split(/\n\s*BRIEF\b/i)[0] ?? text;

  const numbered: string[] = [];
  for (const line of beforeBrief.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:\*{0,2})?(\d+)\s*[).:\-–—]\s*(.+?)\s*$/);
    if (!m) continue;
    const n = Number(m[1]);
    if (n < 1 || n > 3) continue;
    const idea = m[2].replace(/\*+/g, '').trim();
    if (idea) numbered[n - 1] = idea;
  }
  if (numbered.filter(Boolean).length > 0) {
    return [numbered[0] || '', numbered[1] || '', numbered[2] || ''];
  }

  const bullets: string[] = [];
  for (const line of beforeBrief.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^ID[EÉ]ES?\b/i.test(trimmed)) continue; // en-tête « IDÉES : » / « IDÉES CLÉS : »
    if (/^BRIEF\b/i.test(trimmed)) break;
    const bullet = trimmed.match(/^(?:[-–—•*]+|\d+[).])\s*(.+)$/);
    if (bullet?.[1]?.trim()) {
      bullets.push(bullet[1].trim());
      if (bullets.length >= 3) break;
    }
  }
  if (bullets.length > 0) {
    return [bullets[0] || '', bullets[1] || '', bullets[2] || ''];
  }

  return empty;
}

function asText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function tokenOrKeep(key: keyof ReelPromptTokenMap, value: string): string {
  const v = value.trim();
  return v || `{{${key}}}`;
}

export function buildReelPromptTokenMap(post: ReelPromptPostFields): ReelPromptTokenMap {
  const [i1, i2, i3] = extractReelIdeas(asText(post.reelScript));
  const hook = (asText(post.overlayText) || asText(post.hookTitle) || asText(post.title)).trim();
  const caption = asText(post.caption).trim();
  const locale = asText(post.locale || 'fr').toLowerCase();
  const langue = locale === 'es' ? 'espagnol' : 'français';
  const chemin = asText(post.rawVideoPath).trim();
  const slug = slugFromMp4Filename(chemin);
  const exception = asText(post.overlayOrException).trim() || 'standard';

  return {
    CHEMIN_MP4: tokenOrKeep('CHEMIN_MP4', chemin),
    SLUG: tokenOrKeep('SLUG', slug),
    LANGUE: langue,
    HOOK: tokenOrKeep('HOOK', hook),
    IDEE_1: tokenOrKeep('IDEE_1', i1),
    IDEE_2: tokenOrKeep('IDEE_2', i2),
    IDEE_3: tokenOrKeep('IDEE_3', i3),
    // Légende vide → consignes « génère-la » (pas le token brut)
    LEGENDE: caption || 'génère-la',
    OVERLAY_OU_EXCEPTION: exception,
  };
}

export function fillReelPromptReference(tokens: ReelPromptTokenMap): string {
  return TEMPLATE_REFERENCE.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const k = key as keyof ReelPromptTokenMap;
    const value = tokens[k];
    // Remplacement via fonction : les `$` éventuels dans le contenu ne cassent pas le prompt.
    return value != null && value !== '' ? value : `{{${key}}}`;
  });
}

/** Prompt prêt à coller dans Claude Code pour un post CM. */
export function buildClaudeCodeReelPrompt(post: ReelPromptPostFields): string {
  return fillReelPromptReference(buildReelPromptTokenMap(post));
}

/**
 * Copie synchrone (execCommand) — fiable dans le geste click Safari.
 * À appeler directement dans onClick, sans async/await avant.
 */
export function copyTextToClipboardSync(text: string): boolean {
  const value = typeof text === 'string' ? text : String(text ?? '');
  if (!value || typeof document === 'undefined') return false;

  const ta = document.createElement('textarea');
  ta.value = value;
  ta.setAttribute('readonly', '');
  // iOS Safari : hors écran mais sélectionnable
  ta.style.position = 'fixed';
  ta.style.top = '0';
  ta.style.left = '0';
  ta.style.width = '2px';
  ta.style.height = '2px';
  ta.style.padding = '0';
  ta.style.margin = '0';
  ta.style.border = 'none';
  ta.style.outline = 'none';
  ta.style.boxShadow = 'none';
  ta.style.background = 'transparent';
  ta.style.opacity = '0';
  ta.style.zIndex = '-1';
  document.body.appendChild(ta);

  const previous = document.activeElement as HTMLElement | null;
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, value.length);

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }

  document.body.removeChild(ta);
  previous?.focus?.();
  return ok;
}

/**
 * Copie presse-papiers : sync d’abord (Safari), puis Clipboard API.
 * Préférer copyTextToClipboardSync dans un onClick pour le geste utilisateur.
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  const value = typeof text === 'string' ? text : String(text ?? '');
  if (!value) throw new Error('Prompt vide — rien à copier.');

  if (copyTextToClipboardSync(value)) return;

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  throw new Error('Impossible de copier dans le presse-papiers.');
}
