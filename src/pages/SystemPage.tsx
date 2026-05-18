import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { systemApi, type SyncProgressItem } from "@/api/system";
import { assetsApi } from "@/api/assets";
import { LoadingState } from "@/components/common/LoadingState";
import {
  Activity, Database, Wifi, Server, CheckCircle2, XCircle,
  RefreshCw, Package, Users, Shield, UserPlus, Trash2,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/format";

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="flex items-center gap-1 text-xs text-gain font-medium">
      <CheckCircle2 size={13} /> Online
    </span>
  ) : (
    <span className="flex items-center gap-1 text-xs text-loss font-medium">
      <XCircle size={13} /> Offline
    </span>
  );
}

function StatusRow({ icon: Icon, label, status, detail }: {
  icon: React.ElementType; label: string; status: boolean; detail?: string;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-haveres-border last:border-0">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", status ? "bg-gain/10" : "bg-loss/10")}>
          <Icon size={16} className={status ? "text-gain" : "text-loss"} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
        </div>
      </div>
      <StatusBadge ok={status} />
    </div>
  );
}

const SYNC_LABELS: Record<string, string> = {
  assets_catalog: "Catálogo de Ativos",
  quotes: "Cotações",
  portfolio_history: "Histórico de Preços",
  portfolio_snapshots: "Snapshots de Portfólio",
  fii_details: "Detalhes FII (v2)",
};

function ProgressRow({ label, item, lastTs }: {
  label: string;
  item: SyncProgressItem;
  lastTs: string | null;
}) {
  const pct = item.total > 0 ? Math.round((item.done / item.total) * 100) : 0;
  const isRunning = item.status === "running";
  const isDone = item.status === "done";
  const isError = item.status === "error";

  return (
    <div className="py-3 border-b border-haveres-border last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-medium text-white">{SYNC_LABELS[label] ?? label}</p>
        <div className="flex items-center gap-2">
          {isRunning && (
            <span className="text-xs text-haveres-blue font-medium font-numeric">
              {item.done}/{item.total}
            </span>
          )}
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", {
            "bg-haveres-blue/10 text-haveres-blue": isRunning,
            "bg-gain/10 text-gain": isDone,
            "bg-loss/10 text-loss": isError,
            "bg-secondary text-muted-foreground": item.status === "idle",
          })}>
            {isRunning ? `${pct}%` : isDone ? "Concluído" : isError ? "Erro" : "Aguardando"}
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-haveres-dark rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", {
            "bg-haveres-blue": isRunning,
            "bg-gain": isDone,
            "bg-loss": isError,
            "bg-haveres-border": item.status === "idle",
          })}
          style={{ width: isDone ? "100%" : isRunning ? `${pct}%` : "0%" }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {isRunning
          ? `Processando… ${item.done} de ${item.total}`
          : lastTs
          ? `Última: ${formatDateTime(lastTs)}`
          : "Nunca sincronizado"}
      </p>
    </div>
  );
}

export function SystemPage() {
  const queryClient = useQueryClient();
  const [adminEmail, setAdminEmail] = useState("");
  const [adminError, setAdminError] = useState("");

  const health = useQuery({
    queryKey: ["system", "health"],
    queryFn: () => systemApi.health().then((r) => r.data),
    refetchInterval: 30000,
  });
  const integrations = useQuery({
    queryKey: ["system", "integrations"],
    queryFn: () => systemApi.integrations().then((r) => r.data),
  });
  const userMetrics = useQuery({
    queryKey: ["system", "users", "metrics"],
    queryFn: () => systemApi.userMetrics().then((r) => r.data),
    refetchInterval: 60000,
  });
  const syncStatus = useQuery({
    queryKey: ["system", "sync-status"],
    queryFn: () => systemApi.syncStatus().then((r) => r.data),
    refetchInterval: 30000,
  });
  const syncProgressQuery = useQuery({
    queryKey: ["system", "sync-progress"],
    queryFn: () => systemApi.syncProgress().then((r) => r.data),
    refetchInterval: (query) => {
      const d = query.state.data;
      const anyRunning = d && Object.values(d).some((i) => i.status === "running");
      return anyRunning ? 2000 : 10000;
    },
  });
  const syncCatalogStatus = useQuery({
    queryKey: ["assets", "sync-status"],
    queryFn: () => assetsApi.syncStatus().then((r) => r.data),
    refetchInterval: 60000,
  });
  const admins = useQuery({
    queryKey: ["system", "admins"],
    queryFn: () => systemApi.listAdmins().then((r) => r.data),
  });

  const syncAll = useMutation({
    mutationFn: () => systemApi.syncAll(),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["system", "sync-status"] });
        queryClient.invalidateQueries({ queryKey: ["assets", "sync-status"] });
      }, 5000);
    },
  });

  const triggerCatalogSync = useMutation({
    mutationFn: (force: boolean) => assetsApi.triggerSync(force),
    onSuccess: () => {
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["assets", "sync-status"] }), 3000);
    },
  });

  const setAdmin = useMutation({
    mutationFn: ({ email, is_admin }: { email: string; is_admin: boolean }) =>
      systemApi.setAdminStatus(email, is_admin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system", "admins"] });
      setAdminEmail("");
      setAdminError("");
    },
    onError: (e: any) => {
      setAdminError(e?.response?.data?.detail ?? "Usuário não encontrado.");
    },
  });

  if (health.isLoading) return <LoadingState />;

  const h = health.data;
  const i = integrations.data;
  const m = userMetrics.data;
  const s = syncCatalogStatus.data;
  const ss = syncStatus.data;
  const sp = syncProgressQuery.data;

  const verifiedRate = m && m.total_users > 0
    ? Math.round((m.verified_users / m.total_users) * 100) : 0;
  const activeRate = m && m.total_users > 0
    ? Math.round((m.active_users / m.total_users) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Status da Aplicação */}
      <div className="card-haveres p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white">Status da Aplicação</h2>
          {h && (
            <span className="ml-auto text-xs text-muted-foreground">
              v{h.version} · {h.environment}
            </span>
          )}
        </div>
        {h && (
          <div>
            <StatusRow icon={Server} label="API" status={h.status === "ok"} detail="Django Ninja" />
            <StatusRow icon={Database} label="Banco de Dados" status={h.database === "ok"} detail="PostgreSQL" />
            <StatusRow icon={Wifi} label="Cache" status={h.cache === "ok"} detail="Redis" />
          </div>
        )}
      </div>

      {/* Sincronizar Tudo */}
      <div className="card-haveres p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RefreshCw size={18} className="text-haveres-blue" />
            <h2 className="text-sm font-semibold text-white">Sincronização</h2>
          </div>
          <button
            onClick={() => syncAll.mutate()}
            disabled={syncAll.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-haveres-blue hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={syncAll.isPending ? "animate-spin" : ""} />
            Sincronizar Tudo
          </button>
        </div>

        {sp && ss !== undefined && (
          <div>
            {(Object.keys(sp) as Array<keyof typeof sp>).map((key) => (
              <ProgressRow
                key={key}
                label={key}
                item={sp[key]}
                lastTs={ss?.[key] ?? null}
              />
            ))}
          </div>
        )}

        {syncAll.isError && (
          <p className="text-xs text-loss mt-2">Erro ao disparar sincronização.</p>
        )}
        {syncAll.isSuccess && (
          <p className="text-xs text-gain mt-2">
            Sincronização iniciada. Cotações e portfólio estão sendo processados em background.
          </p>
        )}
      </div>

      {/* Usuários */}
      <div className="card-haveres p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white">Usuários da Plataforma</h2>
          {m && (
            <span className="ml-auto text-xs text-muted-foreground">
              Ativos {activeRate}% · Verificados {verifiedRate}%
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { val: m?.total_users, label: "Total de usuários", color: "text-white" },
            { val: m?.active_users, label: "Usuários ativos", color: "text-white" },
            { val: m?.verified_users, label: "E-mails verificados", color: "text-gain" },
            { val: m?.users_with_transactions, label: "Com movimentações", color: "text-white" },
            { val: m?.users_with_open_finance, label: "Com Open Finance", color: "text-white" },
            { val: m?.new_users_last_7_days, label: "Novos (7 dias)", color: "text-haveres-blue" },
            { val: m?.new_users_last_30_days, label: "Novos (30 dias)", color: "text-haveres-blue" },
          ].map(({ val, label, color }) => (
            <div key={label} className="bg-haveres-dark rounded-lg p-3 text-center">
              <p className={cn("text-2xl font-numeric font-bold", color)}>{val ?? "—"}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Integrações */}
      {i && (
        <div className="card-haveres p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Integrações Externas</h2>
          <StatusRow
            icon={Activity}
            label={`Cotações — ${i.quote_provider}`}
            status={i.quote_provider_available}
            detail={i.quote_provider === "mock" ? "Modo desenvolvimento" : "Provedor externo"}
          />
          <StatusRow
            icon={Wifi}
            label={`Open Finance — ${i.open_finance_provider}`}
            status={i.open_finance_provider === "mock" || true}
            detail={i.open_finance_provider === "mock" ? "Modo desenvolvimento" : "Provedor externo"}
          />
        </div>
      )}

      {/* Catálogo de Ativos */}
      <div className="card-haveres p-5">
        <div className="flex items-center gap-2 mb-4">
          <Package size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white">Catálogo de Ativos</h2>
          {s && (
            <span className={cn("ml-2 text-xs font-medium", s.is_fresh ? "text-gain" : "text-amber-400")}>
              {s.is_fresh ? "● Fresco" : "● Cache expirado"}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-haveres-dark rounded-lg p-3 text-center">
            <p className="text-2xl font-numeric font-bold text-white">{s?.total ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Ativos ativos</p>
          </div>
          <div className="bg-haveres-dark rounded-lg p-3 text-center">
            <p className="text-2xl font-numeric font-bold text-white">{s?.processed ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Processados</p>
          </div>
          <div className="bg-haveres-dark rounded-lg p-3 text-center">
            <p className="text-2xl font-numeric font-bold text-gain">{s?.created ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Criados</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-t border-haveres-border">
          <div>
            <p className="text-xs text-muted-foreground">Última sincronização</p>
            <p className="text-sm text-white mt-0.5">
              {s?.synced_at ? formatDateTime(s.synced_at) : "Nunca sincronizado"}
            </p>
            {s?.provider && <p className="text-xs text-muted-foreground mt-0.5">via {s.provider}</p>}
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <button
              onClick={() => triggerCatalogSync.mutate(false)}
              disabled={triggerCatalogSync.isPending || s?.is_fresh}
              className={cn(
                "flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                s?.is_fresh
                  ? "bg-haveres-border text-muted-foreground cursor-not-allowed"
                  : "bg-haveres-blue hover:bg-blue-600 text-white"
              )}
            >
              <RefreshCw size={12} className={triggerCatalogSync.isPending ? "animate-spin" : ""} />
              Sincronizar
            </button>
            <button
              onClick={() => triggerCatalogSync.mutate(true)}
              disabled={triggerCatalogSync.isPending}
              className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-haveres-dark border border-haveres-border hover:border-haveres-blue text-muted-foreground hover:text-white transition-colors"
            >
              Forçar
            </button>
          </div>
        </div>
      </div>

      {/* Administradores */}
      <div className="card-haveres p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white">Administradores</h2>
        </div>

        <div className="space-y-2 mb-4">
          {admins.data?.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between py-2.5 px-3 bg-haveres-dark rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">{admin.email}</p>
                {(admin.first_name || admin.display_name) && (
                  <p className="text-xs text-muted-foreground">
                    {admin.first_name ? `${admin.first_name} ${admin.last_name}`.trim() : admin.display_name}
                  </p>
                )}
              </div>
              <button
                onClick={() => setAdmin.mutate({ email: admin.email, is_admin: false })}
                disabled={setAdmin.isPending}
                className="p-1.5 rounded-lg text-loss hover:bg-loss/10 transition-colors"
                title="Remover admin"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {admins.data?.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum administrador cadastrado.</p>
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t border-haveres-border">
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => { setAdminEmail(e.target.value); setAdminError(""); }}
            placeholder="email@exemplo.com"
            className="flex-1 bg-haveres-dark border border-haveres-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-haveres-blue"
          />
          <button
            onClick={() => setAdmin.mutate({ email: adminEmail, is_admin: true })}
            disabled={!adminEmail || setAdmin.isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-haveres-blue hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
          >
            <UserPlus size={14} />
            Tornar Admin
          </button>
        </div>
        {adminError && <p className="text-xs text-loss mt-2">{adminError}</p>}
      </div>

    </div>
  );
}
