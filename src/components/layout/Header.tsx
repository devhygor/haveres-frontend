import { useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/carteira": "Carteira de Investimentos",
  "/movimentacoes": "Movimentações",
  "/proventos": "Proventos",
  "/importacoes": "Importações",
  "/open-finance": "Open Finance",
  "/configuracoes": "Configurações",
  "/sistema": "Status do Sistema",
};

export function Header() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const title = PAGE_TITLES[location.pathname] ?? "Haveres";

  function handleRefresh() {
    queryClient.invalidateQueries();
  }

  return (
    <header className="h-16 border-b border-haveres-border bg-haveres-card flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-white transition-colors"
          title="Atualizar dados"
        >
          <RefreshCw size={16} />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-haveres-blue to-haveres-green flex items-center justify-center">
          <span className="text-white text-xs font-bold">
            {user?.full_name?.[0]?.toUpperCase() ?? "U"}
          </span>
        </div>
      </div>
    </header>
  );
}
