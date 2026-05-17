export interface Dividend {
  id: string;
  asset_id: string;
  asset_ticker: string;
  asset_name: string;
  dividend_type: string;
  dividend_type_display: string;
  ex_date: string;
  payment_date: string | null;
  quantity_held: number;
  value_per_share: number;
  gross_amount: number;
  ir_withheld: number;
  net_amount: number;
  notes: string;
  source?: "manual" | "brapi_sync";
}
