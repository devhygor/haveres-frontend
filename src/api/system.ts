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

export const systemApi = {
  health: () => api.get<HealthStatus>("/system/health"),
  integrations: () => api.get<IntegrationStatus>("/system/integrations"),
  syncAssetsCatalogDaily: () => api.post<AssetsCatalogSyncResult>("/system/assets/sync-daily"),
};
