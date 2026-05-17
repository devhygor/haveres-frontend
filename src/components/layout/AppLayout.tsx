import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/utils/cn";
import { systemApi } from "@/api/system";

export function AppLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  useEffect(() => {
    systemApi.syncAssetsCatalogDaily().catch(() => undefined);
  }, []);

  return (
    <div className="flex h-screen bg-haveres-dark overflow-hidden">
      <Sidebar />
      <div
        className={cn(
          "flex flex-col flex-1 min-w-0 transition-all duration-300",
          sidebarOpen ? "ml-64" : "ml-16"
        )}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
