import { useQuery } from "@tanstack/react-query";
import { systemApi } from "@/api/system";
import { LoadingState } from "@/components/common/LoadingState";
import { Activity, Database, Wifi, Server, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/utils/cn";

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
  const health = useQuery({
    queryKey: ["system", "health"],
    queryFn: () => systemApi.health().then((r) => r.data),
    refetchInterval: 30000,
  });
  const integrations = useQuery({
    queryKey: ["system", "integrations"],
    queryFn: () => systemApi.integrations().then((r) => r.data),
  });

  if (health.isLoading) return <LoadingState />;

  const h = health.data;
  const i = integrations.data;

  return (
    <div className="space-y-6 max-w-2xl">
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
    </div>
  );
}
