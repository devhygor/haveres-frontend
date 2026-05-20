import { api } from "@/config/api";

export interface HealthStatus {
  status: string; version: string; database: string; cache: string; environment: string;
}
export interface IntegrationStatus {
  quote_provider: string; quote_provider_available: boolean; open_finance_provider: string;
}
export interface AssetsCatalogSyncResult {
  status: string; provider: string; created: number; updated: number;
  processed: number; skipped: boolean; message: string;
}
export interface UserMetrics {
  total_users: number; active_users: number; verified_users: number;
  new_users_last_7_days: number; new_users_last_30_days: number;
  users_with_transactions: number; users_with_open_finance: number;
}
export type SyncName =
  | "assets_catalog" | "fii_details" | "crypto_catalog"
  | "quotes" | "currencies" | "fii_dividends" | "macro_indicators" | "crypto_quotes"
  | "asset_fundamentals" | "asset_profiles" | "financial_statements"
  | "currency_history" | "fii_indicator_history" | "fii_reports"
  | "inflation" | "prime_rate"
  | "portfolio_history" | "portfolio_snapshots"
  | "options_chain" | "treasury_bonds" | "treasury_benchmark_repair"
  | "all_dividend_history";

export interface SyncStatus {
  assets_catalog: string | null;
  fii_details: string | null;
  crypto_catalog: string | null;
  quotes: string | null;
  currencies: string | null;
  fii_dividends: string | null;
  macro_indicators: string | null;
  crypto_quotes: string | null;
  asset_fundamentals: string | null;
  asset_profiles: string | null;
  financial_statements: string | null;
  currency_history: string | null;
  fii_indicator_history: string | null;
  fii_reports: string | null;
  inflation: string | null;
  prime_rate: string | null;
  portfolio_history: string | null;
  portfolio_snapshots: string | null;
  options_chain: string | null;
  treasury_bonds: string | null;
  treasury_benchmark_repair: string | null;
}
export interface SyncAllResult {
  assets_catalog: string;
  fii_details: string;
  crypto_catalog: string;
  quotes: string;
  currencies: string;
  fii_dividends: string;
  macro_indicators: string;
  crypto_quotes: string;
  asset_fundamentals: string;
  asset_profiles: string;
  financial_statements: string;
  currency_history: string;
  fii_indicator_history: string;
  fii_reports: string;
  inflation: string;
  prime_rate: string;
  portfolio_history: string;
  portfolio_snapshots: string;
  options_chain: string;
  treasury_bonds: string;
  treasury_benchmark_repair: string;
}
export interface SyncProgressItem {
  status: "idle" | "running" | "done" | "error";
  done: number;
  total: number;
  started_at: string | null;
  finished_at: string | null;
}
export type SyncProgress = Record<SyncName, SyncProgressItem>;
export interface AdminUser {
  id: number; email: string; display_name: string; first_name: string; last_name: string;
}

export const systemApi = {
  health: () => api.get<HealthStatus>("/system/health"),
  integrations: () => api.get<IntegrationStatus>("/system/integrations"),
  syncAssetsCatalogDaily: () => api.post<AssetsCatalogSyncResult>("/system/assets/sync-daily"),
  userMetrics: () => api.get<UserMetrics>("/system/users/metrics"),
  syncStatus: () => api.get<SyncStatus>("/system/sync-status"),
  syncAll: () => api.post<SyncAllResult>("/system/sync-all"),
  cancelAll: () => api.post("/system/cancel-all"),
  listAdmins: () => api.get<AdminUser[]>("/system/admins"),
  setAdminStatus: (email: string, is_admin: boolean) =>
    api.post("/system/admins/set", { email, is_admin }),
  syncProgress: () => api.get<SyncProgress>("/system/sync-progress"),
  triggerSync: (name: string) => api.post(`/system/sync/${name}`),
  repairTreasuryBenchmark: () => api.post("/system/portfolio/repair-treasury-benchmark"),
};
