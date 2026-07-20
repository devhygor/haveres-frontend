import { api } from "@/config/api";
import type { Asset } from "@/types/asset";

export type { Asset };

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
  { value: "FI", label: "Fundo de Investimento" },
];

export const SECTOR_TYPES = [
  { value: "FINANCE", label: "Financeiro" },
  { value: "REAL_ESTATE", label: "Imobiliário" },
  { value: "UTILITIES", label: "Utilidades" },
  { value: "CONSUMER", label: "Consumo" },
  { value: "HEALTH", label: "Saúde" },
  { value: "TECHNOLOGY", label: "Tecnologia" },
  { value: "INDUSTRY", label: "Indústria" },
  { value: "ENERGY", label: "Energia" },
  { value: "MATERIALS", label: "Materiais" },
  { value: "TELECOM", label: "Telecomunicações" },
  { value: "OTHER", label: "Outro" },
];

export interface AssetAdminUpdate {
  name?: string;
  asset_type?: string;
  sector?: string;
  cnpj?: string;
  isin?: string;
  logo_url?: string;
  description?: string;
  is_active?: boolean;
}

export const assetsApi = {
  list: () => api.get<Asset[]>("/assets/"),
  create: (payload: { ticker: string; name: string; asset_type: string; sector?: string; initial_price?: number }) =>
    api.post<Asset>("/assets/", payload),
  syncStatus: () => api.get<AssetSyncStatus>("/assets/sync/status"),
  triggerSync: (force = false) => api.post<{ message: string }>(`/assets/sync?force=${force}`),
  adminList: (params?: { search?: string; asset_type?: string }) =>
    api.get<Asset[]>("/assets/admin/list", { params }),
  adminUpdate: (assetId: string, payload: AssetAdminUpdate) =>
    api.patch<Asset>(`/assets/admin/${assetId}`, payload),
};
