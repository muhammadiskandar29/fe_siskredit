/**
 * QRIS Dinamis Helper - Standar EMVCo Bank Indonesia
 * Menghasilkan string QRIS Dinamis dengan Tag 54 (Nominal Pas + 3 Digit Unik)
 */

function formatEmvTag(tag: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${tag}${len}${value}`;
}

// CRC16-CCITT calculation for EMVCo
function calculateCRC16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    crc ^= c << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

export interface DynamicQRISParams {
  nominal: number;
  kodeUnik?: number;
  invoiceNumber?: string;
  merchantName?: string;
  merchantCity?: string;
  nmid?: string;
}

export function generateDynamicQRIS(params: DynamicQRISParams): {
  rawString: string;
  totalBayar: number;
  qrImageUrl: string;
} {
  const kode = params.kodeUnik ?? 0;
  const total = Math.round(params.nominal) + kode;
  const merchantName = (params.merchantName || 'KOPKAR AL-AZHAR BSD').toUpperCase().slice(0, 25);
  const merchantCity = (params.merchantCity || 'TANGERANG SELATAN').toUpperCase().slice(0, 15);
  const nmid = params.nmid || 'ID1020261109001';
  const invoice = params.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;

  // Tag 26: Merchant Info (National QRIS)
  const sub00 = formatEmvTag('00', 'ID.CO.QRIS.WWW');
  const sub01 = formatEmvTag('01', nmid);
  const tag26 = formatEmvTag('26', `${sub00}${sub01}`);

  // Tag 54: Transaction Amount (Dynamic)
  const tag54 = formatEmvTag('54', String(total));

  // Tag 62: Additional Data (Invoice & Terminal)
  const sub01_inv = formatEmvTag('01', invoice.slice(0, 15));
  const tag62 = formatEmvTag('62', sub01_inv);

  let rawWithoutCrc = [
    formatEmvTag('00', '01'), // Payload Format Indicator
    formatEmvTag('01', '12'), // 12 = Dynamic QR (Nominal terkunci)
    tag26,
    formatEmvTag('52', '6012'), // MCC: Koperasi / Lembaga Keuangan
    formatEmvTag('53', '360'),  // IDR
    tag54,                      // Amount
    formatEmvTag('58', 'ID'),   // Country
    formatEmvTag('59', merchantName),
    formatEmvTag('60', merchantCity),
    formatEmvTag('61', '15322'),
    tag62,
    '6304' // Tag 63 Header
  ].join('');

  const crc = calculateCRC16(rawWithoutCrc);
  const rawString = `${rawWithoutCrc}${crc}`;

  // Generate QR image via SVG Data URI / QuickChart
  const encodedData = encodeURIComponent(rawString);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodedData}&margin=10`;

  return {
    rawString,
    totalBayar: total,
    qrImageUrl,
  };
}

