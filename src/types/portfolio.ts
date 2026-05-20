export interface FIIDetail {
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

export interface Position {
  asset_id: string;
  ticker: string;
  name: string;
  asset_type: string;
  sector: string;
  quantity: number;
  average_price: number;
  total_invested: number;
  current_price: number;
  current_value: number;
  pl_absolute: number;
  pl_percent: number;
  realized_gain: number;
  allocation: number;
  // Fundamentalistas
  price_to_earnings?: number | null;
  price_to_book?: number | null;
  earnings_per_share?: number | null;
  market_cap?: number | null;
  week_52_high?: number | null;
  week_52_low?: number | null;
  logo_url?: string;
  fii_detail?: FIIDetail | null;
  pricing_reference_at?: string | null;
}

export interface PortfolioSummary {
  total_value: number;
  total_invested: number;
  pl_absolute: number;
  pl_percent: number;
  dividends_month: number;
  dividends_year: number;
  positions_count: number;
  valuation_reference_at?: string | null;
  valuation_reference_min_at?: string | null;
  valuation_reference_max_at?: string | null;
  positions: Position[];
}

export interface ProjectedDividend {
  ticker: string;
  name: string;
  asset_type: string;
  logo_url: string;
  dividend_type: string;
  dividend_type_display: string;
  value_per_share: number;
  quantity: number;
  expected_amount: number;
  expected_date: string | null;
  source: "DECLARED" | "FII_PROJECTED";
}

export interface AllocationItem {
  type?: string;
  type_display?: string;
  sector?: string;
  sector_display?: string;
  value: number;
  allocation: number;
}

export interface PatrimonyPoint {
  date: string;
  total_value: number;
  total_invested: number;
  total_dividends_month: number;
  type_breakdown?: Record<string, number>;
}

export interface DividendsEvolution {
  month: string;
  total: number;
}
