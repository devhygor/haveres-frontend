export interface HistoricalQuote {
  date: string;
  close_price: number;
  open_price: number | null;
  high_price: number | null;
  low_price: number | null;
  volume: number | null;
}

export interface CurrencyQuote {
  currency_pair: string;
  date: string;
  bid: number;
  ask: number;
  high: number | null;
  low: number | null;
  variation: number | null;
}

export interface MacroIndicator {
  indicator_type: string;
  date: string;
  value: number;
  accumulated_12m: number | null;
}

export interface BenchmarkPoint {
  date: string;
  portfolio_return: number;
  cdi_return: number;
}
