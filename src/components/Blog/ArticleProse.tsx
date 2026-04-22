export function ArticleProse({ text }: { text: string }) {
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
