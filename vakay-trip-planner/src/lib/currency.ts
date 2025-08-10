// Currency conversion utilities
// Uses Exchange Rate API: https://open.er-api.com/v6/latest/

export interface ExchangeRateResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
  time_last_update_unix: number;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

// Common currencies with their symbols
export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
];

/**
 * Fetch exchange rates from the API
 */
export async function fetchExchangeRates(baseCurrency: string): Promise<ExchangeRateResponse> {
  const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.result !== 'success') {
    throw new Error('Exchange rate API returned an error');
  }
  
  return data;
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: Record<string, number>
): { convertedAmount: number; exchangeRate: number } {
  // If currencies are the same, no conversion needed
  if (fromCurrency === toCurrency) {
    return { convertedAmount: amount, exchangeRate: 1 };
  }
  
  // Get the exchange rate
  const exchangeRate = exchangeRates[toCurrency];
  
  if (!exchangeRate) {
    throw new Error(`Exchange rate not found for ${toCurrency}`);
  }
  
  // Convert the amount
  const convertedAmount = Math.round(amount * exchangeRate * 100) / 100;
  
  return { convertedAmount, exchangeRate };
}

/**
 * Format currency with proper symbol and locale
 */
export function formatCurrency(amount: number, currency: string): string {
  const currencyInfo = CURRENCIES.find(c => c.code === currency);
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch {
    // Fallback if currency is not supported by Intl
    const symbol = currencyInfo?.symbol || currency;
    return `${symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  const currencyInfo = CURRENCIES.find(c => c.code === currency);
  return currencyInfo?.symbol || currency;
}

/**
 * Validate currency code
 */
export function isValidCurrency(currency: string): boolean {
  return CURRENCIES.some(c => c.code === currency);
}
