import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { LandingPage } from "@/pages/LandingPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { PortfolioPage } from "@/pages/PortfolioPage";
import { RebalancingPage } from "@/pages/RebalancingPage";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { DividendsPage } from "@/pages/DividendsPage";
import { ImportsPage } from "@/pages/ImportsPage";
import { OpenFinancePage } from "@/pages/OpenFinancePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { SystemPage } from "@/pages/SystemPage";
import { AssetDetailPage } from "@/pages/AssetDetailPage";
import { useAuthStore } from "@/stores/authStore";

function HomeRoute() {
  const token = useAuthStore((s) => s.accessToken);
  return token ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user?.is_staff) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="carteira" element={<PortfolioPage />} />
        <Route path="rebalanceamento" element={<RebalancingPage />} />
        <Route path="movimentacoes" element={<TransactionsPage />} />
        <Route path="proventos" element={<DividendsPage />} />
        <Route path="importacoes" element={<ImportsPage />} />
        <Route path="open-finance" element={<OpenFinancePage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
        <Route path="sistema" element={<AdminRoute><SystemPage /></AdminRoute>} />
        <Route path="ativos/:ticker" element={<AssetDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
