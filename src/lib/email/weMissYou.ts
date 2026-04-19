/** Modèles d’e-mail « Tu nous manques » — brancher Resend/SendGrid dans un worker ou Edge Function. */

export type WeMissYouVariant = 'studio' | 'tapis';

const SUBJECT = 'Fit Mangas — On reprend le rythme ensemble';

export function buildWeMissYouEmail(params: {
  firstName: string | null;
  variant: WeMissYouVariant;
}): { subject: string; text: string; html: string } {
  const name = params.firstName?.trim();
  const greeting = name ? `Bonjour ${name},` : 'Bonjour,';

  const body =
    params.variant === 'studio'
      ? `On ne t’a pas vu au studio récemment…`
      : `On ne t’a pas vu sur le tapis en ligne récemment…`;

  const text = `${greeting}

${body}

Si tu veux réserver une séance ou retrouver ton espace, rends-toi sur ton compte Fit Mangas.

À très vite,
L’équipe Fit Mangas`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #2a2622;">
  <p>${greeting}</p>
  <p><strong>${body}</strong></p>
  <p>Si tu veux réserver une séance ou retrouver ton espace, connecte-toi à ton compte Fit Mangas.</p>
  <p>À très vite,<br/>L’équipe Fit Mangas</p>
</body>
</html>`.trim();

  return { subject: SUBJECT, text, html };
}
