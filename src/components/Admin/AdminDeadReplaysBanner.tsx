'use client';

type Props = {
  count: number;
};

export function AdminDeadReplaysBanner({ count }: Props) {
  return (
    <div
      role="alert"
      className="mb-8 rounded-2xl border border-amber-300/80 bg-amber-50/90 px-5 py-4 text-sm text-amber-950 shadow-sm"
    >
      <p className="font-semibold">
        {count} replay{count > 1 ? 's' : ''} validé{count > 1 ? 's' : ''} illisible{count > 1 ? 's' : ''} sur Vimeo
      </p>
      <p className="mt-1 text-xs leading-relaxed text-amber-900/90">
        La vidéo a disparu du compte Vimeo (404). Les clientes voient un badge « bientôt ». Ne supprimez jamais un replay
        Jibri sur Vimeo sans vérification. Utilisez « Vérifier lisibilité Vimeo » ci-dessous ou contactez le support
        Vimeo.
      </p>
    </div>
  );
}
