import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { systemApi } from "@/api/system";
import { assetsApi } from "@/api/assets";
import { LoadingState } from "@/components/common/LoadingState";
import { Activity, Database, Wifi, Server, CheckCircle2, XCircle, RefreshCw, Package, Users } from "lucide-react";
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
  icon: React.ElementType; label: string; status: boolean; detail?: string
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-haveres-border last:border-0">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", status ? "bg-gain-bg" : "bg-loss-bg")}>
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

export function SystemPage() {
  const queryClient = useQueryClient();

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
    queryKey: ["assets", "sync-status"],
    queryFn: () => assetsApi.syncStatus().then((r) => r.data),
    refetchInterval: 60000,
  });

  const triggerSync = useMutation({
    mutationFn: (force: boolean) => assetsApi.triggerSync(force),
    onSuccess: () => {
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["assets", "sync-status"] }), 3000);
    },
  });

  if (health.isLoading) return <LoadingState />;

  const h = health.data;
  const i = integrations.data;
  const m = userMetrics.data;
  const s = syncStatus.data;

  const verifiedRate = m && m.total_users > 0
    ? Math.round((m.verified_users / m.total_users) * 100)
    : 0;
  const activeRate = m && m.total_users > 0
    ? Math.round((m.active_users / m.total_users) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-4xl">
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
          <div className="bg-haveres-dark rounded-lg p-3 text-center">
            <p className="text-2xl font-numeric font-bold text-white">{m?.total_users ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Total de usuários</p>
          </div>
          <div className="bg-haveres-dark rounded-lg p-3 text-center">
            <p className="text-2xl font-numeric font-bold text-white">{m?.active_users ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Usuários ativos</p>
          </div>
          <div className="bg-haveres-dark rounded-lg p-3 text-center">
            <p className="text-2xl font-numeric font-bold text-gain">{m?.verified_users ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">E-mails verificados</p>
          </div>
          <div className="bg-haveres-dark rounded-lg p-3 text-center">
            <p className="text-2xl font-numeric font-bold text-white">{m?.users_with_transactions ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Com movimentações</p>
          </div>
          <div className="bg-haveres-dark rounded-lg p-3 text-center">
            <p className="text-2xl font-numeric font-bold text-white">{m?.users_with_open_finance ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Com Open Finance</p>
          </div>
          <div className="bg-haveres-dark rounded-lg p-3 text-center">
            <p className="text-2xl font-numeric font-bold text-haveres-blue">{m?.new_users_last_7_days ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Novos (7 dias)</p>
          </div>
          <div className="bg-haveres-dark rounded-lg p-3 text-center col-span-2 sm:col-span-1">
            <p className="text-2xl font-numeric font-bold text-haveres-blue">{m?.new_users_last_30_days ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Novos (30 dias)</p>
          </div>
        </div>
      </div>

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
            {s?.provider && (
              <p className="text-xs text-muted-foreground mt-0.5">via {s.provider}</p>
            )}
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <button
              onClick={() => triggerSync.mutate(false)}
              disabled={triggerSync.isPending || s?.is_fresh}
              className={cn(
                "flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                s?.is_fresh
                  ? "bg-haveres-border text-muted-foreground cursor-not-allowed"
                  : "bg-haveres-blue hover:bg-blue-600 text-white"
              )}
            >
              <RefreshCw size={12} className={triggerSync.isPending ? "animate-spin" : ""} />
              Sincronizar
            </button>
            <button
              onClick={() => triggerSync.mutate(true)}
              disabled={triggerSync.isPending}
              className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-haveres-dark border border-haveres-border hover:border-haveres-blue text-muted-foreground hover:text-white transition-colors"
            >
              Forçar
            </button>
          </div>
        </div>

        {triggerSync.isSuccess && (
          <p className="text-xs text-gain mt-2">Sincronização agendada. Aguarde alguns instantes.</p>
        )}
        {triggerSync.isError && (
          <p className="text-xs text-loss mt-2">Erro ao agendar sincronização.</p>
        )}
      </div>
    </div>
  );
}
