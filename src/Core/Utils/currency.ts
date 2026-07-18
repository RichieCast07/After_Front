const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formatea un valor monetario de forma consistente en toda la app: "$1,234.00".
 * Acepta number o string; valores no numéricos se tratan como 0.
 */
export function formatCurrency(value: number | string | null | undefined): string {
  const amount = Number(value);
  return currencyFormatter.format(Number.isFinite(amount) ? amount : 0);
}
