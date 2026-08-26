const PT_BR_NUMBER = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const PT_BR_MULTIPLIER = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

function finiteOrZero(value: number, label: string): number {
  if (Number.isFinite(value)) return Object.is(value, -0) ? 0 : value;
  console.error(`[format] ${label} recebeu um valor inválido:`, value);
  return 0;
}

/** Formatação visual universal: pt-BR, inteiro quando exato e no máximo 1 decimal. */
export function formatGameNumber(value: number): string {
  const safe = finiteOrZero(value, 'formatGameNumber');
  const rounded = Math.round((safe + Math.sign(safe) * Number.EPSILON) * 10) / 10;
  return PT_BR_NUMBER.format(Math.abs(rounded) < 0.05 ? 0 : rounded);
}

/** Multiplicadores de design podem preservar até duas casas (ex.: 1,45x). */
export function formatGameMultiplier(value: number): string {
  return `${PT_BR_MULTIPLIER.format(finiteOrZero(value, 'formatGameMultiplier'))}x`;
}

export function formatGamePercent(value: number, fromRatio = true): string {
  return `${formatGameNumber(fromRatio ? value * 100 : value)}%`;
}

// Compatibilidade com os componentes existentes.
export const fmt = formatGameNumber;
