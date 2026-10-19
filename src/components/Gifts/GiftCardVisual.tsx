export function GiftCardVisual({
  months,
  from,
  to,
  code,
}: {
  months: number;
  from: string;
  to: string;
  code?: string;
}) {
  return (
    <div className="relative aspect-[1.586] w-full overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#2c2621_0%,#1c1916_100%)] text-white shadow-[0_30px_60px_-18px_rgba(29,26,23,0.55),0_10px_24px_rgba(29,26,23,0.18)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/programmes/barre-exterieur.jpg" alt="" className="absolute inset-y-0 right-0 h-full w-[52%] object-cover object-[50%_30%] opacity-90" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#231f1b_0%,#231f1b_42%,rgba(35,31,27,0.55)_62%,rgba(35,31,27,0.05)_100%)]" />
      <div className="absolute inset-[10px] rounded-[16px] border border-[#c9a96e]/45" />
      <div className="absolute left-[7%] top-[11%] flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="h-7 w-7 object-contain" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/80">FitMangas</span>
      </div>
      <div className="absolute left-[7%] top-[34%]">
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.3em] text-[#e8c99a]">Carte cadeau</p>
        <p className="fm-display mt-1 text-[38px] leading-none !text-white md:text-[52px]">{months} mois</p>
        <p className="mt-1.5 text-[12px] text-white/70">de Pilates &amp; Barre en visio</p>
      </div>
      <div className="absolute bottom-[11%] left-[7%] right-[7%] flex items-end justify-between gap-3">
        <p className="text-[11.5px] leading-snug text-white/85">
          Pour <b className="font-semibold text-white">{to || '…'}</b>
          <br />
          <span className="text-white/60">de la part de {from || '…'}</span>
        </p>
        {code ? (
          <span className="rounded-lg border border-white/25 bg-white/10 px-2.5 py-1 font-mono text-[11px] tracking-[0.12em] text-white/90 backdrop-blur">
            {code}
          </span>
        ) : null}
      </div>
    </div>
  );
}
