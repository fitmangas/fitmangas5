import { join } from 'path';
import { Defs, Document, Font, Image, LinearGradient, Page, Rect, Stop, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';

/**
 * C02 — carte cadeau imprimable, A5 paysage (595 × 420 pt), maquette « C02-carte-cadeau-pdf-a5 ».
 * Photo d'Alejandra à gauche, texte à droite, code + QR vers la page d'activation.
 */

const fontsDir = join(process.cwd(), 'public/fonts');
Font.register({
  family: 'GiftInter',
  fonts: [
    { src: join(fontsDir, 'inter-latin-400-normal.woff'), fontWeight: 400 },
    { src: join(fontsDir, 'inter-latin-500-normal.woff'), fontWeight: 500 },
    { src: join(fontsDir, 'inter-latin-600-normal.woff'), fontWeight: 600 },
  ],
});
Font.register({
  family: 'GiftPlayfair',
  fonts: [{ src: join(fontsDir, 'playfair-display-latin-600-italic.woff'), fontWeight: 600, fontStyle: 'italic' }],
});
Font.registerHyphenationCallback((word) => [word]);

const W = 595.28;
const H = 419.53;
const INK = '#2D2D2D';
const MUTED = '#8A8178';
const ORANGE = '#C45D3E';

const s = StyleSheet.create({
  page: { backgroundColor: '#FFFAF5', position: 'relative', fontFamily: 'GiftInter' },
  brand: { position: 'absolute', left: 285, top: 33, fontSize: 8.5, letterSpacing: 4, color: '#6F6862', fontWeight: 600 },
  kicker: { position: 'absolute', right: 31, top: 34, fontSize: 8, letterSpacing: 3.4, color: ORANGE, fontWeight: 600 },
  offer: { position: 'absolute', left: 255, top: 69, fontSize: 11, color: MUTED },
  title: { position: 'absolute', left: 253, right: 36, top: 84, fontFamily: 'GiftPlayfair', fontStyle: 'italic', fontWeight: 600, fontSize: 33, lineHeight: 1.08, color: INK },
  sub: { position: 'absolute', left: 255, right: 36, fontSize: 10.5, color: MUTED },
  quoteBar: { position: 'absolute', left: 255, width: 2, backgroundColor: '#D6B57C' },
  quote: { position: 'absolute', left: 266, right: 40, fontFamily: 'GiftPlayfair', fontStyle: 'italic', fontWeight: 600, fontSize: 11.5, lineHeight: 1.45, color: '#4A4440' },
  codeLabel: { position: 'absolute', left: 255, top: 316, fontSize: 7.5, letterSpacing: 3, color: MUTED, fontWeight: 600 },
  codeBox: {
    position: 'absolute',
    left: 255,
    top: 328,
    width: 172,
    height: 35,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E3A48E',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingLeft: 13,
  },
  code: { fontFamily: 'Courier-Bold', fontSize: 16.5, letterSpacing: 3.2, color: INK },
  activate: { position: 'absolute', left: 255, top: 370, fontSize: 9, color: MUTED },
  activateStrong: { color: INK, fontWeight: 600 },
  qrBox: { position: 'absolute', left: 485, top: 310, width: 68, height: 68, backgroundColor: '#FFFFFF', borderRadius: 7, padding: 5 },
  scan: { position: 'absolute', left: 470, width: 98, top: 384, fontSize: 6.5, letterSpacing: 2.6, color: '#A39A92', textAlign: 'center' },
  pill: {
    position: 'absolute',
    left: 15,
    top: 385,
    paddingVertical: 5,
    paddingHorizontal: 11,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 99,
  },
  pillText: { fontSize: 7, letterSpacing: 2.4, color: INK, fontWeight: 600 },
});

export type GiftPdfCopy = {
  kicker: string;
  offers: (from: string) => string;
  title: (months: number) => [string, string];
  sub: (to: string) => string;
  codeLabel: string;
  activate: string;
  before: (date: string) => string;
  scan: string;
  with: string;
};

export const GIFT_PDF_COPY: Record<'fr' | 'es', GiftPdfCopy> = {
  fr: {
    kicker: 'CARTE CADEAU',
    offers: (from) => `${from} t’offre`,
    title: (m) => [`${m} mois de Pilates `, '& Barre'],
    sub: (to) => `en visio avec Alejandra, pour ${to}`,
    codeLabel: 'TON CODE',
    activate: 'Active-le sur ',
    before: (d) => `avant le ${d} · sans carte bancaire`,
    scan: 'SCANNE-MOI',
    with: 'AVEC ALEJANDRA',
  },
  es: {
    kicker: 'TARJETA REGALO',
    offers: (from) => `${from} te regala`,
    title: (m) => [`${m} ${m > 1 ? 'meses' : 'mes'} de Pilates `, 'y Barre'],
    sub: (to) => `en visio con Alejandra, para ${to}`,
    codeLabel: 'TU CÓDIGO',
    activate: 'Actívalo en ',
    before: (d) => `antes del ${d} · sin tarjeta bancaria`,
    scan: 'ESCANÉAME',
    with: 'CON ALEJANDRA',
  },
};

export function GiftPdf({
  lang,
  months,
  from,
  to,
  message,
  code,
  expiresLabel,
  qrDataUrl,
}: {
  lang: 'fr' | 'es';
  months: number;
  from: string;
  to: string;
  message: string;
  code: string;
  /** « 14 octobre 2027 » */
  expiresLabel: string;
  qrDataUrl: string;
}) {
  const t = GIFT_PDF_COPY[lang];
  const [titleA, titleB] = t.title(months);
  const hasMessage = message.trim().length > 0;
  const msgLines = Math.min(4, Math.ceil(message.trim().length / 62));
  const subTop = 160;
  const quoteTop = 188;
  return (
    <Document title={`${t.kicker} — FitMangas`} author="FitMangas" creator="FitMangas">
      <Page size={[W, H]} style={s.page}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={join(process.cwd(), 'public/gifts/carte-photo.jpg')} style={{ position: 'absolute', left: 0, top: 0, width: 248, height: H, objectFit: 'cover', objectPosition: '30% 40%' }} />
        <Svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
          <Defs>
            <LinearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#FFFAF5" stopOpacity={0} />
              <Stop offset="100%" stopColor="#FFFAF5" stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x={140} y={0} width={110} height={H} fill="url(#fade)" />
          <Rect x={225} y={18} width={352} height={382} rx={10} ry={10} fill="none" stroke="#E6D3AE" strokeWidth={0.8} />
        </Svg>

        <View style={s.pill}>
          <Text style={s.pillText}>{t.with}</Text>
        </View>

        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={join(process.cwd(), 'public/programmes/logo-flamme.png')} style={{ position: 'absolute', left: 258, top: 28, width: 17, height: 18 }} />
        <Text style={s.brand}>FITMANGAS</Text>
        <Text style={s.kicker}>{t.kicker}</Text>

        <Text style={s.offer}>{t.offers(from)}</Text>
        <Text style={s.title}>
          {titleA}
          <Text style={{ color: ORANGE }}>{titleB}</Text>
        </Text>
        <Text style={[s.sub, { top: subTop }]}>{t.sub(to)}</Text>

        {hasMessage ? (
          <>
            <View style={[s.quoteBar, { top: quoteTop, height: 12 + msgLines * 16 }]} />
            <Text style={[s.quote, { top: quoteTop }]}>« {message.trim()} »</Text>
          </>
        ) : null}

        <Text style={s.codeLabel}>{t.codeLabel}</Text>
        <View style={s.codeBox}>
          <Text style={s.code}>{code}</Text>
        </View>
        <Text style={s.activate}>
          {t.activate}
          <Text style={s.activateStrong}>fitmangas.com/offrir/activer</Text>
        </Text>
        <Text style={[s.activate, { top: 382 }]}>{t.before(expiresLabel)}</Text>

        <View style={s.qrBox}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={qrDataUrl} style={{ width: 58, height: 58 }} />
        </View>
        <Text style={s.scan}>{t.scan}</Text>
      </Page>
    </Document>
  );
}
