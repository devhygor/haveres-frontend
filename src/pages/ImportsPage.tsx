import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { importsApi, SOURCE_LABELS, type ImportBatch } from "@/api/imports";

const SOURCES = [
  { value: "b3", label: "B3 (Excel)" },
  { value: "xp", label: "XP" },
  { value: "clear", label: "Clear" },
  { value: "generic", label: "CSV Genérico" },
];

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:    <Clock size={14} className="text-yellow-400" />,
  PREVIEWED:  <Clock size={14} className="text-haveres-blue" />,
  IMPORTED:   <CheckCircle size={14} className="text-gain" />,
  CANCELLED:  <XCircle size={14} className="text-loss" />,
  ERROR:      <AlertCircle size={14} className="text-loss" />,
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Pendente",
  PREVIEWED: "Aguardando confirmação",
  IMPORTED:  "Importado",
  CANCELLED: "Cancelado",
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
        className={`card-haveres p-8 flex flex-col items-center gap-4 border-2 border-dashed transition-colors cursor-pointer
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
              <div key={b.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="flex items-center gap-3">
                  {STATUS_ICON[b.status] ?? <Clock size={14} />}
                  <div>
                    <p className="text-white font-medium">{b.file_name}</p>
                    <p className="text-muted-foreground text-xs">
                      {SOURCE_LABELS[b.source] ?? b.source}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-muted-foreground text-xs font-numeric">
                  <span>{STATUS_LABEL[b.status] ?? b.status}</span>
                  <span>{b.imported_rows}/{b.total_rows} linhas</span>
                  {b.error_rows > 0 && (
                    <span className="text-loss">{b.error_rows} erros</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de importação */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Importar extrato"
        size="md"
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

            <div className="flex justify-end gap-2 pt-2">
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
            <p className="text-sm text-muted-foreground">
              Revise o resumo antes de confirmar a importação.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total de linhas", value: preview.total_rows },
                { label: "Linhas válidas", value: preview.valid_rows, className: "text-gain" },
                { label: "Linhas com erro", value: preview.error_rows, className: preview.error_rows > 0 ? "text-loss" : "" },
              ].map((item) => (
                <div key={item.label} className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`text-lg font-numeric font-semibold text-white ${item.className ?? ""}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {preview.error_message && (
              <div className="bg-loss/10 border border-loss/30 rounded-lg p-3">
                <p className="text-xs text-loss">{preview.error_message}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
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
