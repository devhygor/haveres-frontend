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
export interface SyncStatus {
  assets_catalog: string | null;
  quotes: string | null;
  portfolio_history: string | null;
  portfolio_snapshots: string | null;
  fii_details: string | null;
}
export interface SyncAllResult {
  assets_catalog: string;
  quotes: string;
  portfolio_history: string;
  portfolio_snapshots: string;
  fii_details: string;
}
export interface SyncProgressItem {
  status: "idle" | "running" | "done" | "error";
  done: number;
  total: number;
  started_at: string | null;
  finished_at: string | null;
}
export interface SyncProgress {
  assets_catalog: SyncProgressItem;
  quotes: SyncProgressItem;
  portfolio_history: SyncProgressItem;
  portfolio_snapshots: SyncProgressItem;
  fii_details: SyncProgressItem;
}
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
  listAdmins: () => api.get<AdminUser[]>("/system/admins"),
  setAdminStatus: (email: string, is_admin: boolean) =>
    api.post("/system/admins/set", { email, is_admin }),
  syncProgress: () => api.get<SyncProgress>("/system/sync-progress"),
  triggerSync: (name: string) => api.post(`/system/sync/${name}`),
};
