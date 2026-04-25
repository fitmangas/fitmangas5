export function ArticleProse({ text }: { text: string }) {
  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(text);
  if (hasHtml) {
    return (
      <div
        className="max-w-none text-base leading-relaxed text-luxury-muted [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-luxury-ink [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-luxury-ink [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_strong]:font-semibold [&_em]:italic"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }

  const blocks = text.split(/\n\n+/).filter((b) => b.trim().length > 0);
  return (
    <div className="max-w-none space-y-5 text-base leading-relaxed text-luxury-muted">
      {blocks.map((block, i) => (
        <p key={i} className="whitespace-pre-wrap">
          {block.trim()}
        </p>
      ))}
    </div>
  );
}
