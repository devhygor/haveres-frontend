export interface Asset {
  id: string;
  ticker: string;
  name: string;
  asset_type: string;
  asset_type_display: string;
  sector: string;
  sector_display: string;
  cnpj: string;
  isin: string;
  logo_url: string;
  description: string;
  is_active: boolean;
}

export const ASSET_TYPE_LABELS: Record<string, string> = {
  STOCK: "Ação", FII: "FII", ETF: "ETF", BDR: "BDR",
  FIXED_INCOME: "Renda Fixa", TREASURY: "Tesouro Direto",
  CASH: "Caixa", CRYPTO: "Crypto",
};
