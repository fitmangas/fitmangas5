/** Modèle e-mail anniversaire — à envoyer via cron + service de messagerie. */

export function buildBirthdayEmail(params: { firstName: string | null }): { subject: string; text: string; html: string } {
  const name = params.firstName?.trim();
  const subject = 'Joyeux anniversaire de la part de Fit Mangas 🎂';

  const text = `${name ? `Bonjour ${name},` : 'Bonjour,'}

Toute l’équipe te souhaite une excellente journée et te remercie de faire partie de la communauté.

À très vite sur le tapis,
L’équipe Fit Mangas`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #2a2622;">
  <p>${name ? `Bonjour ${name},` : 'Bonjour,'}</p>
  <p>Toute l’équipe te souhaite une excellente journée et te remercie de faire partie de la communauté.</p>
  <p>À très vite sur le tapis,<br/>L’équipe Fit Mangas</p>
</body>
</html>`.trim();

  return { subject, text, html };
}
