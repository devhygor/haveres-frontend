import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { PortfolioPage } from "@/pages/PortfolioPage";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { DividendsPage } from "@/pages/DividendsPage";
import { ImportsPage } from "@/pages/ImportsPage";
import { OpenFinancePage } from "@/pages/OpenFinancePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { SystemPage } from "@/pages/SystemPage";
import { AssetDetailPage } from "@/pages/AssetDetailPage";
import { useAuthStore } from "@/stores/authStore";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="carteira" element={<PortfolioPage />} />
        <Route path="movimentacoes" element={<TransactionsPage />} />
        <Route path="proventos" element={<DividendsPage />} />
        <Route path="importacoes" element={<ImportsPage />} />
        <Route path="open-finance" element={<OpenFinancePage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
        <Route path="sistema" element={<SystemPage />} />
        <Route path="ativos/:ticker" element={<AssetDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
