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

export interface CryptoQuoteItem {
  ticker: string;
  coin_name: string;
  logo_url: string;
  date: string;
  currency: string;
  price: number;
  change: number | null;
  change_percent: number | null;
  day_low: number | null;
  day_high: number | null;
  market_cap: number | null;
}

export interface FinancialStatementItem {
  statement_type: string;
  period_type: string;
  period_end_date: string;
  // Income Statement
  total_revenue: number | null;
  cost_of_revenue: number | null;
  gross_profit: number | null;
  ebit: number | null;
  ebitda: number | null;
  net_income: number | null;
  interest_expense: number | null;
  income_tax_expense: number | null;
  // Balance Sheet
  total_assets: number | null;
  total_liabilities: number | null;
  total_equity: number | null;
  cash_and_equivalents: number | null;
  short_term_debt: number | null;
  long_term_debt: number | null;
  retained_earnings: number | null;
  // Cash Flow Statement
  operating_cash_flow: number | null;
  investing_cash_flow: number | null;
  financing_cash_flow: number | null;
  capital_expenditures: number | null;
  free_cash_flow: number | null;
}

export interface OptionContract {
  expiration_date: string;
  option_type: "CALL" | "PUT";
  strike: number;
  contract_symbol: string;
  last_price: number | null;
  bid: number | null;
  ask: number | null;
  change: number | null;
  change_percent: number | null;
  volume: number | null;
  open_interest: number | null;
  implied_volatility: number | null;
  in_the_money: boolean;
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
