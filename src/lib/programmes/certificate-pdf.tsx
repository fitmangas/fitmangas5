import { join } from 'path';
import {
  Circle,
  Defs,
  Document,
  Font,
  Image,
  LinearGradient,
  Page,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';

/**
 * B08 — certificat de réussite (A4 paysage, 842 × 595 pt), maquette « B08-certificat-pdf-a4 ».
 * Pas de nombre de lives tant que la présence aux lives n'est pas mesurée (rapport lot 2a).
 */

const fontsDir = join(process.cwd(), 'public/fonts');
Font.register({
  family: 'CertInter',
  fonts: [
    { src: join(fontsDir, 'inter-latin-400-normal.woff'), fontWeight: 400 },
    { src: join(fontsDir, 'inter-latin-500-normal.woff'), fontWeight: 500 },
    { src: join(fontsDir, 'inter-latin-600-normal.woff'), fontWeight: 600 },
  ],
});
Font.register({
  family: 'CertPlayfair',
  fonts: [{ src: join(fontsDir, 'playfair-display-latin-600-italic.woff'), fontWeight: 600, fontStyle: 'italic' }],
});
Font.registerHyphenationCallback((word) => [word]);

const W = 842;
const H = 595;
const GOLD = '#C9A96E';
const INK = '#2D2D2D';
const MUTED = '#7A726B';
const ORANGE = '#C45D3E';

const s = StyleSheet.create({
  page: { backgroundColor: '#FFFAF5', position: 'relative', fontFamily: 'CertInter' },
  abs: { position: 'absolute', left: 0, right: 0, textAlign: 'center' },
  brand: { fontSize: 8.5, letterSpacing: 4.2, color: '#6F6862', fontWeight: 500 },
  kicker: { fontSize: 10, letterSpacing: 3.8, color: ORANGE, fontWeight: 600 },
  lead: { fontSize: 11, color: MUTED },
  name: { fontFamily: 'CertPlayfair', fontStyle: 'italic', fontWeight: 600, fontSize: 50, color: INK },
  program: { fontFamily: 'CertPlayfair', fontStyle: 'italic', fontWeight: 600, fontSize: 28, color: ORANGE },
  stats: { fontSize: 8.6, letterSpacing: 2.6, color: '#5F5750', fontWeight: 600 },
  period: { fontSize: 9.5, color: MUTED },
  sign: { fontFamily: 'CertPlayfair', fontStyle: 'italic', fontWeight: 600, fontSize: 25, color: INK },
  signLabel: { fontSize: 7.6, letterSpacing: 2.6, color: MUTED },
  right: { position: 'absolute', right: 72, textAlign: 'right' },
  site: { fontSize: 8.6, color: INK, fontWeight: 600 },
  small: { fontSize: 7.8, color: MUTED },
  tiny: { fontSize: 7, color: '#9A918A' },
  seal: { fontSize: 5.6, letterSpacing: 1.3, color: '#FFFFFF', fontWeight: 600, textAlign: 'center' },
});

export type CertificateCopy = {
  kicker: string;
  lead: string;
  forProgram: string;
  signLabel: string;
  seal: [string, string];
  number: (n: string) => string;
  disclaimer: string;
};

export const CERTIFICATE_COPY: Record<'fr' | 'es', CertificateCopy> = {
  fr: {
    kicker: 'CERTIFICAT DE RÉUSSITE',
    lead: 'Ce certificat est remis à',
    forProgram: 'pour avoir terminé le programme',
    signLabel: 'ALEJANDRA · COACH FITMANGAS',
    seal: ['PROGRAMME', 'VALIDÉ'],
    number: (n) => `N° ${n}`,
    disclaimer: 'Programme suivi en ligne · sans valeur de diplôme',
  },
  es: {
    kicker: 'CERTIFICADO DE LOGRO',
    lead: 'Este certificado se entrega a',
    forProgram: 'por haber terminado el programa',
    signLabel: 'ALEJANDRA · COACH FITMANGAS',
    seal: ['PROGRAMA', 'VALIDADO'],
    number: (n) => `N.º ${n}`,
    disclaimer: 'Programa seguido en línea · sin valor de diploma',
  },
};

function Diamond({ x, y }: { x: number; y: number }) {
  const r = 5;
  return <Polygon points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`} fill={GOLD} />;
}

export function CertificatePdf({
  lang,
  name,
  program,
  stats,
  period,
  number,
}: {
  lang: 'fr' | 'es';
  name: string;
  program: string;
  /** « 3 semaines · 9 séances · 4 h 20 d'entraînement » */
  stats: string;
  /** « Du 5 au 23 octobre 2026 » */
  period: string;
  number: string;
}) {
  const t = CERTIFICATE_COPY[lang];
  const nameSize = name.length > 26 ? 38 : name.length > 20 ? 44 : 50;
  const programSize = program.length > 34 ? 22 : 28;
  return (
    <Document title={`${t.kicker} — ${program}`} author="FitMangas" creator="FitMangas">
      <Page size="A4" orientation="landscape" style={s.page}>
        <Svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
          <Defs>
            <RadialGradient id="glowTop" cx={W / 2} cy={-40} r={470} fx={W / 2} fy={-40} gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="#F7DFC6" stopOpacity={0.85} />
              <Stop offset="100%" stopColor="#FFFAF5" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="glowCorner" cx={W} cy={H} r={330} fx={W} fy={H} gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="#F5E1D6" stopOpacity={0.7} />
              <Stop offset="100%" stopColor="#FFFAF5" stopOpacity={0} />
            </RadialGradient>
            <LinearGradient id="sealFill" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#E6C893" />
              <Stop offset="100%" stopColor="#BF9455" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={W} height={H} fill="url(#glowTop)" />
          <Rect x={0} y={0} width={W} height={H} fill="url(#glowCorner)" />
          <Rect x={19} y={19} width={W - 38} height={H - 38} fill="none" stroke={GOLD} strokeWidth={0.9} />
          <Rect x={26} y={26} width={W - 52} height={H - 52} rx={3} ry={3} fill="none" stroke="#E7D7B8" strokeWidth={0.6} />
          <Diamond x={19} y={19} />
          <Diamond x={W - 19} y={19} />
          <Diamond x={19} y={H - 19} />
          <Diamond x={W - 19} y={H - 19} />
          <Path d={`M ${W / 2 - 135} 263 L ${W / 2 + 135} 263`} stroke="#E2CFA6" strokeWidth={0.7} />
          <Path d="M 72 528 L 216 528" stroke="#CFC6BC" strokeWidth={0.6} />
          <Circle cx={W / 2} cy={510} r={41} fill="#F1E3CC" opacity={0.55} />
          <Circle cx={W / 2} cy={508} r={38} fill="url(#sealFill)" />
          <Circle cx={W / 2} cy={508} r={33} fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={0.6} />
        </Svg>

        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={join(process.cwd(), 'public/programmes/logo-flamme.png')} style={{ position: 'absolute', top: 56, left: W / 2 - 16, width: 32, height: 34 }} />
        <Text style={[s.abs, s.brand, { top: 106 }]}>FITMANGAS</Text>
        <Text style={[s.abs, s.kicker, { top: 146 }]}>{t.kicker}</Text>
        <Text style={[s.abs, s.lead, { top: 176 }]}>{t.lead}</Text>
        <Text style={[s.abs, s.name, { top: 243 - nameSize * 1.02, fontSize: nameSize }]}>{name}</Text>
        <Text style={[s.abs, s.lead, { top: 280 }]}>{t.forProgram}</Text>
        <Text style={[s.abs, s.program, { top: 300 + (28 - programSize) / 2, fontSize: programSize }]}>{program}</Text>
        <Text style={[s.abs, s.stats, { top: 349 }]}>{stats.toUpperCase()}</Text>
        <Text style={[s.abs, s.period, { top: 368 }]}>{period}</Text>

        <Text style={[s.sign, { position: 'absolute', left: 72, top: 492 }]}>Alejandra</Text>
        <Text style={[s.signLabel, { position: 'absolute', left: 72, top: 536 }]}>{t.signLabel}</Text>

        <Svg width={24} height={24} viewBox="0 0 24 24" style={{ position: 'absolute', left: W / 2 - 8, top: 484 }}>
          <Path
            d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"
            stroke="#FFFFFF"
            strokeWidth={2}
            fill="none"
          />
          <Circle cx={12} cy={8} r={6} stroke="#FFFFFF" strokeWidth={2} fill="none" />
        </Svg>
        <Text style={[s.seal, { position: 'absolute', left: W / 2 - 40, width: 80, top: 507 }]}>{t.seal[0]}</Text>
        <Text style={[s.seal, { position: 'absolute', left: W / 2 - 40, width: 80, top: 516 }]}>{t.seal[1]}</Text>

        <View style={[s.right, { top: 505 }]}>
          <Text style={s.site}>fitmangas.com</Text>
          <Text style={[s.small, { marginTop: 6 }]}>{t.number(number)}</Text>
          <Text style={[s.tiny, { marginTop: 6 }]}>{t.disclaimer}</Text>
        </View>
      </Page>
    </Document>
  );
}
