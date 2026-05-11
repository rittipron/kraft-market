// Thai PromptPay QR — EMVCo spec (ISO 20022)

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return ((crc & 0xffff).toString(16).toUpperCase()).padStart(4, '0');
}

function field(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, '0')}${value}`;
}

function merchantAccount(phoneOrId: string): string {
  const normalized = phoneOrId.startsWith('0')
    ? `66${phoneOrId.slice(1)}`
    : phoneOrId;
  const inner = field('00', 'A000000677010111') + field('01', normalized);
  return field('29', inner);
}

export function buildPromptPayQRString(
  recipient: string,
  amountSatang?: number,
): string {
  const amount = amountSatang ? (amountSatang / 100).toFixed(2) : undefined;

  const parts = [
    field('00', '01'),
    field('01', amount ? '12' : '11'),
    merchantAccount(recipient),
    field('52', '0000'),
    field('53', '764'),
    ...(amount ? [field('54', amount)] : []),
    field('58', 'TH'),
    field('59', 'Kraft Market'),
    field('60', 'Bangkok'),
  ];

  const payload = parts.join('') + '6304';
  return payload + crc16(payload);
}

export function promptPayQRUrl(recipient: string, amountTHB: number): string {
  const qrStr = buildPromptPayQRString(recipient, Math.round(amountTHB * 100));
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrStr)}`;
}
