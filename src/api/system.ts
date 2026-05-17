import { api } from "@/config/api";

export interface HealthStatus {
  status: string; version: string; database: string; cache: string; environment: string;
}
export interface IntegrationStatus {
  quote_provider: string; quote_provider_available: boolean; open_finance_provider: string;
}
export interface AssetsCatalogSyncResult {
  status: string;
  provider: string;
  created: number;
  updated: number;
  processed: number;
  skipped: boolean;
  message: string;
}

export interface UserMetrics {
  total_users: number;
  active_users: number;
  verified_users: number;
  new_users_last_7_days: number;
  new_users_last_30_days: number;
  users_with_transactions: number;
  users_with_open_finance: number;
}

export const systemApi = {
  health: () => api.get<HealthStatus>("/system/health"),
  integrations: () => api.get<IntegrationStatus>("/system/integrations"),
  syncAssetsCatalogDaily: () => api.post<AssetsCatalogSyncResult>("/system/assets/sync-daily"),
  userMetrics: () => api.get<UserMetrics>("/system/users/metrics"),
};
