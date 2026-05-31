/** Prépare le markdown Gemini pour remark-gfm (tableaux GFM, pas de blocs code parasites). */
export function normalizeAdvisorMarkdown(raw: string): string {
  let text = raw.trim();

  const fullFence = text.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/i);
  if (fullFence) text = fullFence[1].trim();

  text = text.replace(/```(?:markdown|md)?\s*\n([\s\S]*?)\n```/gi, (_, inner: string) => {
    if (looksLikeGfmTable(inner)) return inner.trim();
    return `\`\`\`\n${inner}\n\`\`\``;
  });

  text = text
    .split('\n')
    .map((line) => {
      if (/^ {4,}\|/.test(line)) return line.replace(/^ +/, '');
      if (/^ {4,}\|[-:\s|]+\|/.test(line.replace(/^ +/, ''))) return line.replace(/^ +/, '');
      return line;
    })
    .join('\n');

  text = text.replace(/([^\n|])\n(\|[^\n]+\|[^\n]*\n\|[-:\s|]+\|)/g, '$1\n\n$2');

  return text.trim();
}

function looksLikeGfmTable(block: string): boolean {
  const lines = block.trim().split('\n');
  if (lines.length < 2) return false;
  const header = lines.find((l) => /^\s*\|/.test(l));
  const separator = lines.find((l) => /^\s*\|[-:\s|]+\|\s*$/.test(l));
  return Boolean(header && separator);
}
