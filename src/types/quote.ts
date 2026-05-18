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

export interface FIIDetailData {
  fii_type: string;
  fii_sector: string;
  managed_by: string;
  management_fee: number | null;
  performance_fee: number | null;
  net_worth: number | null;
  net_worth_per_share: number | null;
  num_assets: number | null;
  dividend_yield: number | null;
  last_dividend: number | null;
  last_dividend_date: string | null;
  pvp: number | null;
  daily_liquidity: number | null;
  management_type: string;
  total_investors: number | null;
}
