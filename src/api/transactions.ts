import { api } from "@/config/api";
import type { Transaction, Broker } from "@/types/transaction";

export interface TransactionFilters {
  asset_id?: string;
  transaction_type?: string;
  date_from?: string;
  date_to?: string;
  broker_id?: string;
}

export interface CreateTransactionPayload {
  asset_id: string;
  transaction_type: string;
  date: string;
  quantity: number;
  price: number;
  fees: number;
  factor: number;
  broker_id: string | null;
  notes: string;
  force?: boolean;
}

export const transactionsApi = {
  list: (filters?: TransactionFilters) =>
    api.get<Transaction[]>("/transactions", { params: filters }),
  create: (payload: CreateTransactionPayload) =>
    api.post<Transaction>("/transactions", payload),
  get: (id: string) => api.get<Transaction>(`/transactions/${id}`),
  update: (id: string, payload: Partial<Transaction>) =>
    api.put<Transaction>(`/transactions/${id}`, payload),
  delete: (id: string) => api.delete(`/transactions/${id}`),
  listBrokers: () => api.get<Broker[]>("/transactions/brokers/list"),
};
