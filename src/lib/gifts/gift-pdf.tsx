import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { join } from 'path';

Font.register({
  family: 'PlayfairGift',
  src: join(process.cwd(), 'public/fonts/playfair-display-latin-600-italic.woff'),
  fontStyle: 'italic',
  fontWeight: 600,
});
Font.register({
  family: 'InterGift',
  src: join(process.cwd(), 'public/fonts/inter-latin-500-normal.woff'),
  fontWeight: 500,
});

const styles = StyleSheet.create({
  page: { backgroundColor: '#1c1916', padding: 28, color: '#FFFAF5' },
  kicker: { fontFamily: 'InterGift', fontSize: 9, letterSpacing: 3, color: '#e8c99a', textTransform: 'uppercase' },
  months: { fontFamily: 'PlayfairGift', fontSize: 42, marginTop: 8, fontStyle: 'italic' },
  body: { fontFamily: 'InterGift', fontSize: 11, marginTop: 10, color: '#d9d2cb' },
  code: { fontFamily: 'InterGift', fontSize: 12, marginTop: 18, letterSpacing: 2 },
});

export function GiftPdf({
  months,
  from,
  to,
  code,
  activateUrl,
}: {
  months: number;
  from: string;
  to: string;
  code: string;
  activateUrl: string;
}) {
  return (
    <Document>
      <Page size={[595.28, 419.53]} style={styles.page}>
        <Text style={styles.kicker}>FitMangas · Carte cadeau</Text>
        <Text style={styles.months}>{months} mois</Text>
        <Text style={styles.body}>
          Pour {to}, de la part de {from}
        </Text>
        <Text style={styles.code}>{code}</Text>
        <Text style={styles.body}>{activateUrl}</Text>
      </Page>
    </Document>
  );
}
