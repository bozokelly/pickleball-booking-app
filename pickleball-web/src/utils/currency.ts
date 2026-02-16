const LOCALE_CURRENCY: Record<string, string> = {
  'en-AU': 'aud',
  'en-NZ': 'nzd',
  'en-GB': 'gbp',
  'en-US': 'usd',
  'en-CA': 'cad',
  'en-IE': 'eur',
  'en-SG': 'sgd',
  'en-ZA': 'zar',
  'en-IN': 'inr',
  'fr-FR': 'eur',
  'de-DE': 'eur',
  'ja-JP': 'jpy',
};

export function getDefaultCurrency(): string {
  if (typeof navigator === 'undefined') return 'usd';
  try {
    const locale = navigator.language || 'en-US';
    return LOCALE_CURRENCY[locale] || LOCALE_CURRENCY[locale.replace('-', '-').toUpperCase()] || 'usd';
  } catch {
    return 'usd';
  }
}
