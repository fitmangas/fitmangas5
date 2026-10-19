import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { join } from 'path';

Font.register({
  family: 'PlayfairCert',
  src: join(process.cwd(), 'public/fonts/playfair-display-latin-600-italic.woff'),
  fontStyle: 'italic',
  fontWeight: 600,
});
Font.register({
  family: 'InterCert',
  src: join(process.cwd(), 'public/fonts/inter-latin-500-normal.woff'),
  fontWeight: 500,
});

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFAF5',
    padding: 48,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kicker: { fontFamily: 'InterCert', fontSize: 11, letterSpacing: 3, color: '#C45D3E', textTransform: 'uppercase' },
  name: { fontFamily: 'PlayfairCert', fontSize: 42, color: '#2D2D2D', marginTop: 16, fontStyle: 'italic' },
  body: { fontFamily: 'InterCert', fontSize: 14, color: '#5F5750', marginTop: 18, textAlign: 'center', maxWidth: 480 },
  number: { fontFamily: 'InterCert', fontSize: 11, color: '#8A8178', marginTop: 28 },
});

export function CertificatePdf({
  name,
  program,
  number,
}: {
  name: string;
  program: string;
  number: string;
}) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.kicker}>Certificat FitMangas</Text>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.body}>a terminé le programme {program} avec Alejandra.</Text>
        <Text style={styles.number}>{number}</Text>
      </Page>
    </Document>
  );
}
