import { NavLink, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, Briefcase, ArrowLeftRight, TrendingUp, Upload,
  Building2, Settings, Activity, ChevronLeft, ChevronRight, LogOut,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/utils/cn";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/carteira", icon: Briefcase, label: "Carteira" },
  { to: "/movimentacoes", icon: ArrowLeftRight, label: "Movimentações" },
  { to: "/proventos", icon: TrendingUp, label: "Proventos" },
  { to: "/importacoes", icon: Upload, label: "Importações" },
  { to: "/open-finance", icon: Building2, label: "Open Finance" },
];

const bottomItems = [
  { to: "/sistema", icon: Activity, label: "Sistema" },
  { to: "/configuracoes", icon: Settings, label: "Configurações" },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { logout, user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  function closeOnMobile() {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setSidebarOpen(false);
    }
  }

  function handleLogout() {
    queryClient.clear();
    logout();
    navigate("/login");
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full z-40 flex flex-col",
        "bg-haveres-card border-r border-haveres-border",
        "transition-all duration-300",
        sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:w-16 md:translate-x-0"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-16 px-4 border-b border-haveres-border",
        sidebarOpen ? "justify-between" : "justify-center")}>
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-haveres-blue to-haveres-green flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-bold text-lg text-white tracking-tight">Haveres</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-white transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={closeOnMobile}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                "hover:bg-secondary hover:text-white",
                isActive
                  ? "bg-haveres-blue/10 text-haveres-blue border border-haveres-blue/20"
                  : "text-muted-foreground",
                !sidebarOpen && "justify-center px-2"
              )
            }
            title={!sidebarOpen ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 space-y-1 border-t border-haveres-border pt-4">
        {bottomItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={closeOnMobile}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                "hover:bg-secondary hover:text-white",
                isActive ? "bg-haveres-blue/10 text-haveres-blue" : "text-muted-foreground",
                !sidebarOpen && "justify-center px-2"
              )
            }
            title={!sidebarOpen ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        ))}

        {/* User */}
        {sidebarOpen && user && (
          <div className="px-3 py-2 mt-2 rounded-lg bg-secondary/50">
            <p className="text-xs font-medium text-white truncate">{user.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm",
            "text-loss hover:bg-loss/10 transition-colors",
            !sidebarOpen && "justify-center px-2"
          )}
          title={!sidebarOpen ? "Sair" : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {sidebarOpen && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
