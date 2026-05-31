'use client';

import type { ReactElement, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

import { normalizeAdvisorMarkdown } from '@/lib/admin/normalize-advisor-markdown';

const markdownComponents: Components = {
  h2: ({ children }) => <h2 className="mt-6 text-lg font-bold text-luxury-ink first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-4 text-base font-semibold text-luxury-ink">{children}</h3>,
  p: ({ children }) => <p className="my-2 text-sm leading-relaxed text-luxury-muted">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-luxury-ink">{children}</strong>,
  ul: ({ children }) => <ul className="my-2 ml-5 list-disc space-y-1.5 text-sm text-luxury-muted">{children}</ul>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  hr: () => <hr className="my-6 border-[#e8e0d8]" />,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-[#e8e0d8]">
      <table className="min-w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[#F5F0EB] text-[11px] font-semibold uppercase tracking-wider text-luxury-ink">{children}</thead>
  ),
  th: ({ children }) => <th className="border border-[#e8e0d8] px-3 py-2.5">{children}</th>,
  td: ({ children }) => <td className="border border-[#e8e0d8] px-3 py-2.5 align-top text-luxury-muted">{children}</td>,
  tr: ({ children }) => <tr className="bg-white/80 even:bg-[#F5F0EB]/40">{children}</tr>,
  pre: ({ children }) => {
    const raw = extractPlainText(children).trim();
    if (looksLikeGfmTable(raw)) {
      return (
        <AdvisorMarkdownRenderer text={raw} className="!bg-transparent !p-0" skipNormalize />
      );
    }
    return (
      <pre className="my-3 overflow-x-auto rounded-xl bg-white/80 p-3 text-xs text-luxury-ink">{children}</pre>
    );
  },
};

function extractPlainText(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractPlainText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    return extractPlainText(el.props.children);
  }
  return '';
}

function looksLikeGfmTable(block: string): boolean {
  const lines = block.trim().split('\n');
  if (lines.length < 2) return false;
  const header = lines.some((l) => /^\s*\|/.test(l));
  const separator = lines.some((l) => /^\s*\|[-:\s|]+\|\s*$/.test(l));
  return header && separator;
}

type Props = {
  text: string;
  className?: string;
  /** Évite une double normalisation lors du rendu récursif depuis pre. */
  skipNormalize?: boolean;
};

export function AdvisorMarkdownRenderer({ text, className, skipNormalize }: Props) {
  const normalized = skipNormalize ? text : normalizeAdvisorMarkdown(text);
  return (
    <div className={className ?? 'advisor-markdown rounded-2xl bg-[#F5F0EB] p-5 md:p-6'}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
