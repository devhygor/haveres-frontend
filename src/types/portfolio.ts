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
}

export interface PortfolioSummary {
  total_value: number;
  total_invested: number;
  pl_absolute: number;
  pl_percent: number;
  dividends_month: number;
  dividends_year: number;
  positions_count: number;
  positions: Position[];
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
}

export interface DividendsEvolution {
  month: string;
  total: number;
}
