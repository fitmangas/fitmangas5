import QRCode from 'qrcode';

/** QR code (PNG en data URI) pour la carte imprimable C02 : lien d'activation avec le code. */
export async function qrPngDataUrl(text: string, size = 420): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: size,
    color: { dark: '#2D2D2DFF', light: '#FFFFFFFF' },
  });
}
