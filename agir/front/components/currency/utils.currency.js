


export function formatCurrencyAmount(amount = 0, locales="fr-FR", style="currency", currency="EUR") {
  return new Intl.NumberFormat(locales, {
    style: style,
    currency: currency,
  }).format(amount / 100)
}