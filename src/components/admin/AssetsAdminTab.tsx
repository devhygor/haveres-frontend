import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assetsApi, ASSET_TYPES, SECTOR_TYPES, type AssetAdminUpdate } from "@/api/assets";
import type { Asset } from "@/types/asset";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";
import { Search, Edit2, X, Check, PenLine, ChevronUp, ChevronDown } from "lucide-react";

const FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  asset_type: "Tipo",
  sector: "Setor",
  cnpj: "CNPJ",
  isin: "ISIN",
  logo_url: "Logo",
  description: "Descrição",
  is_active: "Ativo",
};

function ManualBadge({ fields }: { fields: string[] }) {
  if (!fields.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {fields.map((f) => (
        <span
          key={f}
          title={`${FIELD_LABELS[f] ?? f} editado manualmente`}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20"
        >
          <PenLine size={9} />
          {FIELD_LABELS[f] ?? f}
        </span>
      ))}
    </div>
  );
}

function EditModal({
  asset,
  onClose,
}: {
  asset: Asset;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AssetAdminUpdate>({
    name: asset.name,
    asset_type: asset.asset_type,
    sector: asset.sector,
    cnpj: asset.cnpj,
    isin: asset.isin,
    logo_url: asset.logo_url,
    description: asset.description,
    is_active: asset.is_active,
  });

  const update = useMutation({
    mutationFn: (payload: AssetAdminUpdate) => assetsApi.adminUpdate(asset.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", "admin"] });
      onClose();
    },
  });

  const field = (label: string, key: keyof AssetAdminUpdate, isManual: boolean) => (
    <div key={key}>
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {label}
        {isManual && (
          <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-400">
            <PenLine size={8} /> manual
          </span>
        )}
      </label>
      <input
        type="text"
        value={String(form[key] ?? "")}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        className="w-full bg-haveres-dark border border-haveres-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-haveres-blue"
      />
    </div>
  );

  const isManual = (f: string) => asset.manual_fields.includes(f);

  const handleSubmit = () => {
    const dirty: AssetAdminUpdate = {};
    if (form.name !== asset.name) dirty.name = form.name;
    if (form.asset_type !== asset.asset_type) dirty.asset_type = form.asset_type;
    if (form.sector !== asset.sector) dirty.sector = form.sector;
    if (form.cnpj !== asset.cnpj) dirty.cnpj = form.cnpj;
    if (form.isin !== asset.isin) dirty.isin = form.isin;
    if (form.logo_url !== asset.logo_url) dirty.logo_url = form.logo_url;
    if (form.description !== asset.description) dirty.description = form.description;
    if (form.is_active !== asset.is_active) dirty.is_active = form.is_active;
    if (!Object.keys(dirty).length) { onClose(); return; }
    update.mutate(dirty);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-haveres-card border border-haveres-border rounded-xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-haveres-border">
          <div>
            <p className="font-semibold text-white">{asset.ticker}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Edição manual — campos salvos protegem contra sync</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {field("Nome", "name", isManual("name"))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                Tipo
                {isManual("asset_type") && (
                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-400">
                    <PenLine size={8} /> manual
                  </span>
                )}
              </label>
              <select
                value={form.asset_type}
                onChange={(e) => setForm((p) => ({ ...p, asset_type: e.target.value }))}
                className="w-full bg-haveres-dark border border-haveres-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-haveres-blue"
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                Setor
                {isManual("sector") && (
                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-400">
                    <PenLine size={8} /> manual
                  </span>
                )}
              </label>
              <select
                value={form.sector}
                onChange={(e) => setForm((p) => ({ ...p, sector: e.target.value }))}
                className="w-full bg-haveres-dark border border-haveres-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-haveres-blue"
              >
                {SECTOR_TYPES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field("CNPJ", "cnpj", isManual("cnpj"))}
            {field("ISIN", "isin", isManual("isin"))}
          </div>

          {field("URL do Logo", "logo_url", isManual("logo_url"))}

          <div>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              Descrição
              {isManual("description") && (
                <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-400">
                  <PenLine size={8} /> manual
                </span>
              )}
            </label>
            <textarea
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full bg-haveres-dark border border-haveres-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-haveres-blue resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground">Ativo</label>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
              className={cn(
                "relative inline-flex h-5 w-9 rounded-full transition-colors",
                form.is_active ? "bg-haveres-blue" : "bg-haveres-border"
              )}
            >
              <span className={cn(
                "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                form.is_active ? "translate-x-4" : "translate-x-0"
              )} />
            </button>
            {isManual("is_active") && (
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-400">
                <PenLine size={8} /> manual
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-haveres-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-white border border-haveres-border hover:border-haveres-blue transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={update.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-haveres-blue hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
          >
            <Check size={14} />
            {update.isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>

        {update.isError && (
          <p className="px-5 pb-4 text-xs text-loss">Erro ao salvar. Tente novamente.</p>
        )}
      </div>
    </div>
  );
}

type SortField = "ticker" | "name" | "asset_type" | "sector";

export function AssetsAdminTab() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [editing, setEditing] = useState<Asset | null>(null);
  const [sort, setSort] = useState<{ field: SortField; dir: "asc" | "desc" }>({
    field: "ticker",
    dir: "asc",
  });

  const { data: assets, isLoading } = useQuery({
    queryKey: ["assets", "admin", search, typeFilter],
    queryFn: () =>
      assetsApi.adminList({ search: search || undefined, asset_type: typeFilter || undefined })
        .then((r) => r.data),
    staleTime: 30000,
  });

  const sorted = assets
    ? [...assets].sort((a, b) => {
        const av = a[sort.field] as string;
        const bv = b[sort.field] as string;
        return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : [];

  const toggleSort = (field: SortField) => {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "asc" }
    );
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) return <ChevronUp size={12} className="text-muted-foreground/40" />;
    return sort.dir === "asc"
      ? <ChevronUp size={12} className="text-haveres-blue" />
      : <ChevronDown size={12} className="text-haveres-blue" />;
  };

  const th = (label: string, field?: SortField) => (
    <th
      className={cn(
        "px-3 py-2.5 text-left text-xs font-medium text-muted-foreground select-none",
        field && "cursor-pointer hover:text-white transition-colors"
      )}
      onClick={field ? () => toggleSort(field) : undefined}
    >
      <span className="flex items-center gap-1">
        {label}
        {field && <SortIcon field={field} />}
      </span>
    </th>
  );

  const manualCount = assets?.filter((a) => a.manual_fields.length > 0).length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ticker ou nome…"
            className="w-full bg-haveres-dark border border-haveres-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-haveres-blue"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-haveres-dark border border-haveres-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-haveres-blue"
        >
          <option value="">Todos os tipos</option>
          {ASSET_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {isLoading ? "Carregando…" : `${sorted.length} ativos`}
          {manualCount > 0 && (
            <span className="ml-2 text-amber-400">{manualCount} com edição manual</span>
          )}
        </p>
      </div>

      <div className="card-haveres overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-haveres-border">
              <tr>
                {th("Ticker", "ticker")}
                {th("Nome", "name")}
                {th("Tipo", "asset_type")}
                {th("Setor", "sector")}
                {th("CNPJ")}
                {th("ISIN")}
                {th("Preço")}
                {th("Status")}
                {th("Campos manuais")}
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-muted-foreground text-xs">
                    Carregando…
                  </td>
                </tr>
              )}
              {!isLoading && sorted.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-muted-foreground text-xs">
                    Nenhum ativo encontrado.
                  </td>
                </tr>
              )}
              {sorted.map((asset) => (
                <tr
                  key={asset.id}
                  className={cn(
                    "border-b border-haveres-border last:border-0 hover:bg-white/[0.02] transition-colors",
                    !asset.is_active && "opacity-50"
                  )}
                >
                  <td className="px-3 py-3">
                    <span className="font-mono font-semibold text-white">{asset.ticker}</span>
                  </td>
                  <td className="px-3 py-3 max-w-[200px]">
                    <span className="text-white truncate block">{asset.name}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-haveres-blue/10 text-haveres-blue font-medium">
                      {asset.asset_type_display}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground text-xs">
                    {asset.sector_display}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                    {asset.cnpj || <span className="text-haveres-border">—</span>}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                    {asset.isin || <span className="text-haveres-border">—</span>}
                  </td>
                  <td className="px-3 py-3 font-numeric text-xs text-white">
                    {asset.current_price != null
                      ? formatCurrency(asset.current_price)
                      : <span className="text-haveres-border">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    {asset.is_active ? (
                      <span className="text-xs text-gain">● Ativo</span>
                    ) : (
                      <span className="text-xs text-loss">● Inativo</span>
                    )}
                  </td>
                  <td className="px-3 py-3 min-w-[140px]">
                    <ManualBadge fields={asset.manual_fields} />
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => setEditing(asset)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                      title="Editar ativo"
                    >
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <EditModal asset={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
