type Props = {
  embedUrl: string;
  title: string;
};

/** Vimeo renvoie parfois des `&amp;` dans l’URL extraite du HTML d’embed. */
function normalizeVimeoIframeSrc(url: string): string {
  return url.trim().replace(/&amp;/g, '&');
}

export function VimeoReplayEmbed({ embedUrl, title }: Props) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-brand-ink/10 bg-black shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
      <iframe
        src={normalizeVimeoIframeSrc(embedUrl)}
        title={title}
        className="h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
