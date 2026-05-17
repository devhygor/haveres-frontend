import { api } from "@/config/api";
import type { Dividend } from "@/types/dividend";

export const dividendsApi = {
  list: (filters?: { asset_id?: string; dividend_type?: string; date_from?: string; date_to?: string }) =>
    api.get<Dividend[]>("/dividends", { params: filters }),
  create: (payload: unknown) => api.post<Dividend>("/dividends", payload),
  get: (id: string) => api.get<Dividend>(`/dividends/${id}`),
  update: (id: string, payload: unknown) => api.put<Dividend>(`/dividends/${id}`, payload),
  delete: (id: string) => api.delete(`/dividends/${id}`),
  sync: () => api.post("/dividends/sync"),
};
