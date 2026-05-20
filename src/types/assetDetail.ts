export interface PerformancePeriod {
  period: string;
  nominal: number | null;
  real: number | null;
}

export interface AssetPerformance {
  ticker: string;
  current_price: string | null;
  periods: PerformancePeriod[];
}

export interface DividendHistoryItem {
  ex_date: string;
  payment_date: string | null;
  value_per_share: string;
  distribution_type: string;
}

export interface DistributionPeriod {
  period: string;
  total_value: string;
  yield_pct: string;
}

export interface DistributionSummary {
  ticker: string;
  current_price: string | null;
  last_dividend: string | null;
  periods: DistributionPeriod[];
}

export interface IndexSeriesPoint {
  date: string;
  value: number;
}

export interface IndexComparisonSeries {
  key: string;
  label: string;
  points: IndexSeriesPoint[];
}

export interface IndexComparison {
  ticker: string;
  months: number;
  series: IndexComparisonSeries[];
}
