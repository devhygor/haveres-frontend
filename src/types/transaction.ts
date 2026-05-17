export interface Transaction {
  id: string;
  asset_id: string;
  asset_ticker: string;
  asset_name: string;
  broker_id: string | null;
  broker_name: string | null;
  transaction_type: string;
  transaction_type_display: string;
  date: string;
  quantity: number;
  price: number;
  fees: number;
  factor: number;
  total_value: number;
  notes: string;
}

export interface Broker {
  id: string;
  name: string;
  cnpj: string;
}
