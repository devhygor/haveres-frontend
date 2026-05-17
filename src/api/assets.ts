import { api } from "@/config/api";

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  asset_type: string;
  asset_type_display: string;
  sector: string;
  sector_display: string;
  is_active: boolean;
}

export interface AssetSyncStatus {
  status: string;
  is_fresh: boolean;
  total: number | null;
  synced_at: string | null;
  provider: string | null;
  created: number | null;
  updated: number | null;
  processed: number | null;
  message: string | null;
}

export const ASSET_TYPES = [
  { value: "STOCK", label: "Ação" },
  { value: "FII", label: "FII" },
  { value: "ETF", label: "ETF" },
  { value: "BDR", label: "BDR" },
  { value: "FIXED_INCOME", label: "Renda Fixa" },
  { value: "TREASURY", label: "Tesouro Direto" },
  { value: "CASH", label: "Caixa" },
  { value: "CRYPTO", label: "Criptomoeda" },
];

export const assetsApi = {
  list: () => api.get<Asset[]>("/assets/"),
  create: (payload: { ticker: string; name: string; asset_type: string; sector?: string }) =>
    api.post<Asset>("/assets/", payload),
  syncStatus: () => api.get<AssetSyncStatus>("/assets/sync/status"),
  triggerSync: (force = false) => api.post<{ message: string }>(`/assets/sync?force=${force}`),
};
