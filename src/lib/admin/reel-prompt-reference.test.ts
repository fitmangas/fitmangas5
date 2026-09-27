import { describe, expect, it } from 'vitest';
import { buildClaudeCodeReelPrompt, TEMPLATE_REFERENCE } from './reel-prompt-reference';

describe('prompt Claude Code — miniature couverture', () => {
  it('inclut l’étape 13 Template A après l’export MP4', () => {
    expect(TEMPLATE_REFERENCE).toContain('13. MINIATURE');
    expect(TEMPLATE_REFERENCE).toContain('make-reel-cover.py');
    expect(TEMPLATE_REFERENCE).toContain('reel-{{SLUG}}_cover.png');
  });

  it('remplit slug + hook (overlay) dans la commande de couverture', () => {
    const prompt = buildClaudeCodeReelPrompt({
      overlayText: 'Relâcher les épaules',
      rawVideoPath: 'FitMangas-Reels/brutes/relacher-les-epaules.MOV',
      locale: 'fr',
    });
    expect(prompt).toContain(
      'python3 FitMangas-Reels/templates/make-reel-cover.py --slug relacher-les --hook "Relâcher les épaules"',
    );
    expect(prompt).toContain('FitMangas-Reels/exports/reel-relacher-les_cover.png');
    expect(prompt).toMatch(/13\. MINIATURE/);
    expect(prompt).not.toMatch(/--hook "\{\{HOOK\}\}"/);
  });
});
