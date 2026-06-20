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
  dividends_received: number;
  pl_total: number;
  pl_total_percent: number;
  allocation: number;
  target_allocation_percent: number;
  target_gap_percent: number;
  target_value: number;
  target_gap_value: number;
  max_buy_price?: number | null;
  max_buy_gap_value?: number | null;
  max_buy_gap_percent?: number | null;
  is_within_max_buy_price?: boolean | null;
  max_buy_pvp?: number | null;
  is_within_max_buy_pvp?: boolean | null;
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
  dividends_12m: number;
  dividends_total: number;
  dividends_total_gross: number;
  dividends_total_ir: number;
  pl_total: number;
  pl_total_percent: number;
  positions_count: number;
  target_allocation_sum: number;
  target_allocation_remaining: number;
  target_allocation_is_valid: boolean;
  valuation_reference_at?: string | null;
  valuation_reference_min_at?: string | null;
  valuation_reference_max_at?: string | null;
  positions: Position[];
}

export interface TargetAllocationInput {
  asset_id: string;
  target_allocation_percent: number;
}

export interface SaveTargetAllocationPayload {
  targets: TargetAllocationInput[];
}

export interface SaveTargetAllocationResult {
  target_allocation_sum: number;
  target_allocation_remaining: number;
  target_allocation_is_valid: boolean;
  positions_count: number;
}

export interface MaxBuyPriceInput {
  asset_id: string;
  max_buy_price: number | null;
  max_buy_pvp: number | null;
}

export interface SaveMaxBuyPricePayload {
  items: MaxBuyPriceInput[];
}

export interface SaveMaxBuyPriceResult {
  configured_count: number;
  positions_count: number;
}

export interface ContributionSimulationPayload {
  amount: number;
}

export interface ContributionRecommendation {
  asset_id: string;
  ticker: string;
  name: string;
  asset_type: string;
  current_price: number;
  quantity_to_buy: number;
  amount_to_buy: number;
  target_allocation_percent: number;
  current_allocation_percent: number;
  projected_allocation_percent: number;
  target_gap_value_before: number;
  target_gap_value_after: number;
  max_buy_price: number | null;
  has_max_buy_rule: boolean;
  is_within_max_buy_price: boolean;
  max_buy_pvp: number | null;
  has_max_buy_pvp_rule: boolean;
  is_within_max_buy_pvp: boolean;
  current_pvp: number | null;
}

export interface ContributionBlockedAsset {
  asset_id: string;
  ticker: string;
  name: string;
  current_price: number;
  max_buy_price: number | null;
  max_buy_pvp: number | null;
  current_pvp: number | null;
  target_gap_value_before: number;
  reason: string;
}

export interface ContributionSimulationResult {
  amount: number;
  allocated_amount: number;
  leftover_amount: number;
  projected_total_value: number;
  considered_assets_count: number;
  buyable_assets_count: number;
  recommendations: ContributionRecommendation[];
  blocked_assets: ContributionBlockedAsset[];
}

export interface RebalancePlanTarget {
  asset_id: string;
  ticker: string;
  name: string;
  asset_type: string;
  logo_url: string;
  target_allocation_percent: number;
  max_buy_price: number | null;
  max_buy_pvp: number | null;
  include_in_sell_plan: boolean;
  current_price: number | null;
  current_quantity: number | null;
  current_value: number | null;
  current_allocation: number | null;
  pvp: number | null;
}

export interface RebalancePlanTargetsResponse {
  total_value: number;
  target_allocation_sum: number;
  target_allocation_remaining: number;
  target_allocation_is_valid: boolean;
  items: RebalancePlanTarget[];
}

export interface RebalanceSellRecommendation {
  asset_id: string;
  ticker: string;
  name: string;
  asset_type: string;
  logo_url: string;
  current_price: number;
  current_quantity: number;
  quantity_to_sell: number;
  amount_to_sell: number;
  target_allocation_percent: number;
  current_allocation_percent: number;
  projected_allocation_percent: number;
}

export interface RebalanceBuyRecommendation {
  asset_id: string;
  ticker: string;
  name: string;
  asset_type: string;
  logo_url: string;
  current_price: number;
  quantity_to_buy: number;
  amount_to_buy: number;
  target_allocation_percent: number;
  current_allocation_percent: number;
  projected_allocation_percent: number;
  target_gap_value_before: number;
  target_gap_value_after: number;
  max_buy_price: number | null;
  has_max_buy_rule: boolean;
  is_within_max_buy_price: boolean;
  max_buy_pvp: number | null;
  has_max_buy_pvp_rule: boolean;
  is_within_max_buy_pvp: boolean;
  current_pvp: number | null;
  is_new_asset: boolean;
}

export interface RebalanceSimulationResult {
  external_amount: number;
  sell_proceeds: number;
  total_available: number;
  allocated_amount: number;
  leftover_amount: number;
  projected_total_value: number;
  buy_recommendations: RebalanceBuyRecommendation[];
  sell_recommendations: RebalanceSellRecommendation[];
  blocked_assets: ContributionBlockedAsset[];
}

export interface SaveRebalancePlanItem {
  asset_id: string;
  target_allocation_percent: number;
  max_buy_price: number | null;
  max_buy_pvp: number | null;
  include_in_sell_plan: boolean;
}

export interface SaveRebalancePlanResult {
  configured_count: number;
  target_allocation_sum: number;
  target_allocation_remaining: number;
  target_allocation_is_valid: boolean;
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
  source: "DECLARED" | "ANNOUNCED" | "FII_PROJECTED";
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
