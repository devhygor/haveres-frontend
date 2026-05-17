import { api } from "@/config/api";

export interface ImportBatch {
  id: string;
  source: string;
  status: string;
  file_name: string;
  total_rows: number;
  valid_rows: number;
  imported_rows: number;
  error_rows: number;
  error_message: string;
}

export const SOURCE_LABELS: Record<string, string> = {
  generic: "CSV Genérico",
  b3: "B3/CEI",
  xp: "XP",
  clear: "Clear",
};

export const importsApi = {
  upload: (source: string, file: File) => {
    const form = new FormData();
    form.append("source", source);
    form.append("file", file);
    return api.post<ImportBatch>("/imports/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  confirm: (batchId: string) => api.post<ImportBatch>(`/imports/${batchId}/confirm`),
  cancel: (batchId: string) => api.post(`/imports/${batchId}/cancel`),
  list: () => api.get<ImportBatch[]>("/imports"),
  get: (batchId: string) => api.get<ImportBatch>(`/imports/${batchId}`),
};
