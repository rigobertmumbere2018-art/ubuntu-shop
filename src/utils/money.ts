export type DepositRule = {
  type: 'fixed' | 'percentage';
  value: number; // centimes USD si 'fixed', basis points (0..10000) si 'percentage'
};

export function calculateLineDepositCents(
  unitPriceCents: number,
  quantity: number,
  rule: DepositRule
): number {
  if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0) {
    throw new Error('Prix unitaire entier invalide');
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('Quantité entière invalide');
  }
  const lineTotal = unitPriceCents * quantity;
  if (rule.type === 'fixed') {
    if (!Number.isInteger(rule.value) || rule.value < 0) {
      throw new Error('Montant fixe acompte invalide');
    }
    return Math.min(rule.value * quantity, lineTotal);
  }
  if (!Number.isInteger(rule.value) || rule.value < 0 || rule.value > 10000) {
    throw new Error('Pourcentage acompte invalide (0..10000 basis points)');
  }
  return Math.round((lineTotal * rule.value) / 10000);
}

export function convertUsdCentsToCdf(
  usdCents: number,
  rateCdfPerUsd: number | null
): number | null {
  if (rateCdfPerUsd === null || !Number.isInteger(rateCdfPerUsd) || rateCdfPerUsd <= 0) {
    return null;
  }
  return Math.round((usdCents * rateCdfPerUsd) / 100);
}

export function formatUsd(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(Math.round(cents));
  const dollars = Math.floor(abs / 100);
  const remainder = String(abs % 100).padStart(2, '0');
  return `${sign}$${dollars.toLocaleString('en-US')}.${remainder}`;
}

export function formatCdf(cdfUnits: number | null): string {
  if (cdfUnits === null) return '— CDF';
  return `${Math.round(cdfUnits).toLocaleString('fr-FR')} CDF`;
}
