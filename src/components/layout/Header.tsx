import { useLocation } from "react-router-dom";
import { Menu, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";

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
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const title = PAGE_TITLES[location.pathname] ?? "Haveres";

  function handleRefresh() {
    const userScopedRoots = [
      "portfolio",
      "transactions",
      "dividends",
      "imports",
      "open-finance",
      "system",
    ];

    queryClient.invalidateQueries({
      predicate: (query) => userScopedRoots.includes(String(query.queryKey[0])),
    });
  }

  return (
    <header className="h-16 border-b border-haveres-border bg-haveres-card flex items-center justify-between px-4 sm:px-6 gap-3 flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-white transition-colors"
          title="Abrir menu"
        >
          <Menu size={16} />
        </button>
        <h1 className="text-base sm:text-lg font-semibold text-white truncate">{title}</h1>
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
