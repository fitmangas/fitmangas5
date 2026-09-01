/**
 * Teste quelques endpoints Vimeo pour lister les vidéos supprimées (corbeille).
 */
const token = process.env.VIMEO_ACCESS_TOKEN?.trim();
if (!token) throw new Error('VIMEO_ACCESS_TOKEN manquant');

const paths = [
  'https://api.vimeo.com/me/videos?filter=deleted',
  'https://api.vimeo.com/me/videos?filter=deletable',
  'https://api.vimeo.com/me/trash',
  'https://api.vimeo.com/me/deleted_videos',
];

async function main() {
  for (const url of paths) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
    });
    const text = await res.text();
    console.log(url.split('?')[0], res.status, text.slice(0, 300));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
