import { describe, expect, it } from 'vitest';

import { normalizeAdvisorMarkdown } from './normalize-advisor-markdown';

describe('normalizeAdvisorMarkdown', () => {
  it('dé-enveloppe un document entier dans ```markdown', () => {
    const raw = '```markdown\n## Titre\n\n| A | B |\n|---|---|\n| 1 | 2 |\n```';
    const out = normalizeAdvisorMarkdown(raw);
    expect(out).toContain('| A | B |');
    expect(out).not.toContain('```');
  });

  it('dé-enveloppe un bloc table interne', () => {
    const raw = `## Actions

\`\`\`markdown
| # | Action |
|---|--------|
| 1 | Publier |
\`\`\``;
    const out = normalizeAdvisorMarkdown(raw);
    expect(out).toContain('| # | Action |');
    expect(out).not.toContain('```');
  });

  it('retire l’indentation 4 espaces des lignes de tableau', () => {
    const raw = '    | # | Action |\n    |---|--------|\n    | 1 | Test |';
    const out = normalizeAdvisorMarkdown(raw);
    expect(out.startsWith('| # | Action |')).toBe(true);
  });
});
