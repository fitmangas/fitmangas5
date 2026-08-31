import { listAllMeVideos } from '@/lib/vimeo';

async function main() {
  const vids = await listAllMeVideos();
  const byTitle = new Map<string, number>();
  for (const v of vids) {
    const t = v.title ?? '(sans titre)';
    byTitle.set(t, (byTitle.get(t) ?? 0) + 1);
  }
  const dups = [...byTitle.entries()].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]);
  const jibri = vids.filter((v) => (v.title ?? '').startsWith('fitmangas-'));
  const dur129 = vids.filter((v) => v.durationSeconds === 129);
  const dur178 = vids.filter((v) => v.durationSeconds === 178);

  console.log('Total Vimeo /me/videos:', vids.length);
  console.log('Jibri-named:', jibri.length);
  console.log('Duration 129s:', dur129.length, '| 178s:', dur178.length);
  console.log('Duplicate title groups:', dups.length);
  for (const [t, c] of dups.slice(0, 8)) {
    console.log(`  x${c}`, t.slice(0, 90));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
