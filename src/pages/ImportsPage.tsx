import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { importsApi, SOURCE_LABELS, type ImportBatch } from "@/api/imports";
import { formatCurrency, formatDate } from "@/utils/format";

const SOURCES = [
  { value: "b3", label: "B3 (Excel)" },
  { value: "xp", label: "XP" },
  { value: "clear", label: "Clear" },
  { value: "generic", label: "CSV Genérico" },
];

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:    <Clock size={14} className="text-yellow-400" />,
  PREVIEW:    <Clock size={14} className="text-haveres-blue" />,
  PROCESSING: <Clock size={14} className="text-haveres-blue" />,
  COMPLETED:  <CheckCircle size={14} className="text-gain" />,
  PREVIEWED:  <Clock size={14} className="text-haveres-blue" />, // legado
  IMPORTED:   <CheckCircle size={14} className="text-gain" />,    // legado
  CANCELLED:  <XCircle size={14} className="text-loss" />,
  FAILED:     <AlertCircle size={14} className="text-loss" />,
  ERROR:      <AlertCircle size={14} className="text-loss" />,    // legado
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Pendente",
  PREVIEW:   "Aguardando confirmação",
  PROCESSING:"Processando",
  COMPLETED: "Concluído",
  PREVIEWED: "Aguardando confirmação", // legado
  IMPORTED:  "Importado",              // legado
  CANCELLED: "Cancelado",
  FAILED:    "Falhou",
  ERROR:     "Erro",
};

export function ImportsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [source, setSource] = useState("b3");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportBatch | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorsExpanded, setErrorsExpanded] = useState(false);
  const [historyErrorsBatch, setHistoryErrorsBatch] = useState<ImportBatch | null>(null);

  const { data: previewRows = [] } = useQuery({
    queryKey: ["import-rows", preview?.id],
    queryFn: () => importsApi.rows(preview!.id).then((r) => r.data),
    enabled: !!preview?.id,
  });

  const validRows = previewRows.filter((r) => r.is_valid);
  const errorRows = previewRows.filter((r) => !r.is_valid);

  const { data: batches = [] } = useQuery({
    queryKey: ["imports"],
    queryFn: () => importsApi.list().then((r) => r.data),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ source, file }: { source: string; file: File }) =>
      importsApi.upload(source, file).then((r) => r.data),
    onSuccess: (batch) => setPreview(batch),
  });

  const confirmMutation = useMutation({
    mutationFn: (batchId: string) => importsApi.confirm(batchId).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["imports"] });
      closeModal();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (batchId: string) => importsApi.cancel(batchId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["imports"] });
      closeModal();
    },
  });

  function closeModal() {
    setModalOpen(false);
    setSelectedFile(null);
    setPreview(null);
    setSource("b3");
    uploadMutation.reset();
  }

  function handleFile(file: File) {
    setSelectedFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setModalOpen(true);
      handleFile(file);
    }
  }

  function handleUpload() {
    if (!selectedFile) return;
    uploadMutation.mutate({ source, file: selectedFile });
  }

  const isLoading =
    uploadMutation.isPending || confirmMutation.isPending || cancelMutation.isPending;

  const uploadError =
    (uploadMutation.error as Error)?.message ||
    (confirmMutation.error as Error)?.message;

  return (
    <div className="space-y-6">
      {/* Drop zone / botão de importar */}
      <div
        className={`card-haveres p-5 sm:p-8 flex flex-col items-center gap-4 border-2 border-dashed transition-colors cursor-pointer
          ${dragOver ? "border-haveres-blue bg-haveres-blue/5" : "border-haveres-border hover:border-haveres-blue/50"}`}
        onClick={() => setModalOpen(true)}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="w-12 h-12 rounded-xl bg-haveres-blue/10 flex items-center justify-center">
          <Upload size={24} className="text-haveres-blue" />
        </div>
        <div className="text-center">
          <p className="text-white font-medium">Importar extrato</p>
          <p className="text-sm text-muted-foreground mt-1">
            Arraste ou clique para selecionar um arquivo CSV ou Excel (.xlsx)
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          {SOURCES.map((s) => (
            <span key={s.value} className="text-xs px-2 py-1 bg-secondary rounded text-muted-foreground">
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Histórico */}
      <div className="card-haveres">
        <div className="flex items-center gap-2 p-5 border-b border-haveres-border">
          <FileText size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white">Histórico de importações</h2>
        </div>
        {batches.length === 0 ? (
          <EmptyState
            icon={Upload}
            title="Nenhuma importação realizada"
            description="Faça upload de um extrato para começar."
          />
        ) : (
          <div className="divide-y divide-haveres-border">
            {batches.map((b) => (
              <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-5 py-3 text-sm">
                <div className="flex items-center gap-3">
                  {STATUS_ICON[b.status] ?? <Clock size={14} />}
                  <div>
                    <p className="text-white font-medium">{b.file_name}</p>
                    <p className="text-muted-foreground text-xs">
                      {SOURCE_LABELS[b.source] ?? b.source}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs font-numeric">
                  <span>{STATUS_LABEL[b.status] ?? b.status}</span>
                  <span>{b.imported_rows}/{b.total_rows} linhas</span>
                  {b.error_rows > 0 && (
                    <button
                      type="button"
                      onClick={() => setHistoryErrorsBatch(b)}
                      className="text-loss hover:underline"
                    >
                      {b.error_rows} erro{b.error_rows > 1 ? "s" : ""}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalhes de erro por lote */}
      <Modal
        open={!!historyErrorsBatch}
        onClose={() => setHistoryErrorsBatch(null)}
        title="Detalhes dos erros da importação"
        size="md"
      >
        {historyErrorsBatch ? (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              <p className="text-white font-medium text-sm">{historyErrorsBatch.file_name}</p>
              <p>{SOURCE_LABELS[historyErrorsBatch.source] ?? historyErrorsBatch.source}</p>
            </div>

            {historyErrorsBatch.row_errors?.length ? (
              <div className="rounded-lg border border-loss/30 overflow-hidden">
                <div className="max-h-64 overflow-y-auto divide-y divide-haveres-border">
                  {historyErrorsBatch.row_errors.map((error) => (
                    <div key={`${historyErrorsBatch.id}-${error.row_number}`} className="flex gap-3 px-3 py-2 text-xs">
                      <span className="text-muted-foreground font-numeric shrink-0">Linha {error.row_number}</span>
                      <span className="text-loss">{error.error_message}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Não há detalhes de linha para este lote.
              </p>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setHistoryErrorsBatch(null)}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-secondary transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Modal de importação */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Importar extrato"
        size={preview ? "lg" : "md"}
      >
        {!preview ? (
          <div className="space-y-4">
            {/* Seleção de fonte */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">Formato do arquivo</label>
              <div className="grid grid-cols-2 gap-2">
                {SOURCES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSource(s.value)}
                    className={`px-3 py-2 rounded-lg text-sm border transition-colors
                      ${source === s.value
                        ? "border-haveres-blue bg-haveres-blue/10 text-haveres-blue"
                        : "border-haveres-border bg-secondary text-muted-foreground hover:border-haveres-blue/40"
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload de arquivo */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">Arquivo CSV</label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                  ${selectedFile ? "border-haveres-blue/60 bg-haveres-blue/5" : "border-haveres-border hover:border-haveres-blue/40"}`}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={20} className="mx-auto mb-2 text-muted-foreground" />
                {selectedFile ? (
                  <p className="text-sm text-white">{selectedFile.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Clique para selecionar o arquivo (.csv, .xlsx)</p>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </div>
            </div>

            {uploadError && (
              <p className="text-xs text-loss">{uploadError}</p>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isLoading}
                className="px-4 py-2 rounded-lg text-sm bg-haveres-blue text-white hover:bg-haveres-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Carregando..." : "Pré-visualizar"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Total", value: preview.total_rows },
                { label: "Válidas", value: preview.valid_rows, className: "text-gain" },
                { label: "Com erro", value: preview.error_rows, className: preview.error_rows > 0 ? "text-loss" : "" },
              ].map((item) => (
                <div key={item.label} className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`text-lg font-numeric font-semibold text-white ${item.className ?? ""}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Tabela de linhas válidas */}
            {validRows.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Registros a importar</p>
                <div className="rounded-lg border border-haveres-border overflow-hidden">
                  <div className="overflow-x-auto max-h-56 overflow-y-auto">
                    <table className="w-full min-w-[640px] text-xs">
                      <thead className="sticky top-0 bg-haveres-card border-b border-haveres-border">
                        <tr className="text-muted-foreground">
                          <th className="text-left px-3 py-2 font-medium">#</th>
                          <th className="text-left px-3 py-2 font-medium">Ticker</th>
                          <th className="text-left px-3 py-2 font-medium">Tipo</th>
                          <th className="text-left px-3 py-2 font-medium">Data</th>
                          <th className="text-right px-3 py-2 font-medium">Qtd</th>
                          <th className="text-right px-3 py-2 font-medium">Preço</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-haveres-border">
                        {validRows.map((row) => (
                          <tr key={row.row_number} className="hover:bg-secondary/50">
                            <td className="px-3 py-2 text-muted-foreground font-numeric">{row.row_number}</td>
                            <td className="px-3 py-2 text-white font-medium">{row.parsed_data?.ticker ?? "—"}</td>
                            <td className="px-3 py-2">
                              <span className={row.parsed_data?.transaction_type === "BUY" ? "text-gain" : "text-loss"}>
                                {row.parsed_data?.transaction_type === "BUY" ? "COMPRA" : "VENDA"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground font-numeric">
                              {row.parsed_data?.date ? formatDate(row.parsed_data.date) : "—"}
                            </td>
                            <td className="px-3 py-2 text-right font-numeric text-white">
                              {row.parsed_data?.quantity ?? "—"}
                            </td>
                            <td className="px-3 py-2 text-right font-numeric text-white">
                              {row.parsed_data?.price ? formatCurrency(Number(row.parsed_data.price)) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Linhas com erro */}
            {errorRows.length > 0 && (
              <div>
                <button
                  onClick={() => setErrorsExpanded((v) => !v)}
                  className="flex items-center gap-2 text-xs text-loss hover:text-loss/80 transition-colors"
                >
                  {errorsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {errorRows.length} linha{errorRows.length > 1 ? "s" : ""} com erro (não serão importadas)
                </button>
                {errorsExpanded && (
                  <div className="mt-2 rounded-lg border border-loss/30 overflow-hidden">
                    <div className="max-h-40 overflow-y-auto divide-y divide-haveres-border">
                      {errorRows.map((row) => (
                        <div key={row.row_number} className="flex gap-3 px-3 py-2 text-xs">
                          <span className="text-muted-foreground font-numeric shrink-0">Linha {row.row_number}</span>
                          <span className="text-loss">{row.error_message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <button
                onClick={() => cancelMutation.mutate(preview.id)}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-secondary transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmMutation.mutate(preview.id)}
                disabled={isLoading || preview.valid_rows === 0}
                className="px-4 py-2 rounded-lg text-sm bg-gain/80 text-white hover:bg-gain/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Importando..." : `Confirmar ${preview.valid_rows} registros`}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
