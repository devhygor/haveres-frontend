import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { portfolioApi } from "@/api/portfolio";
import { FundamentalsCard } from "@/components/cards/FundamentalsCard";
import { FIIDetailCard } from "@/components/cards/FIIDetailCard";
import { FinancialStatementsCard } from "@/components/cards/FinancialStatementsCard";
import OptionsChainCard from "@/components/cards/OptionsChainCard";
import { PriceHistoryChart } from "@/components/charts/PriceHistoryChart";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { formatCurrency, formatPercent } from "@/utils/format";
import { plClass } from "@/utils/format";
import { cn } from "@/utils/cn";
import { AssetLogo } from "@/components/common/AssetLogo";
import { TermTooltip } from "@/components/common/TermTooltip";

export function AssetDetailPage() {
  const { ticker } = useParams<{ ticker: string }>();

  const summary = useQuery({
    queryKey: ["portfolio", "summary"],
    queryFn: () => portfolioApi.getSummary().then((r) => r.data),
  });

  if (summary.isLoading) return <LoadingState />;
  if (summary.isError) return <ErrorState onRetry={() => summary.refetch()} />;

  const position = summary.data?.positions.find(
    (p) => p.ticker === ticker?.toUpperCase()
  );

  if (!position) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <p className="text-muted-foreground text-sm">Ativo {ticker} não encontrado na carteira.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <Link to="/dashboard" className="w-fit flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mt-1">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex items-center gap-3">
          <AssetLogo logoUrl={position.logo_url} ticker={position.ticker} size={40} />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-mono">{position.ticker}</h1>
            <p className="text-sm text-muted-foreground">{position.name}</p>
          </div>
        </div>
        <div className="sm:ml-auto text-left sm:text-right">
          <p className="text-xl sm:text-2xl font-bold text-white font-mono">{formatCurrency(position.current_price)}</p>
          <p className={cn("text-sm font-mono font-medium", plClass(position.pl_percent))}>
            {formatPercent(position.pl_percent, true)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Qtd", value: position.quantity },
          { label: <TermTooltip term="Preço Médio" />, key: "Preço Médio", value: formatCurrency(position.average_price) },
          { label: <TermTooltip term="Investido" />, key: "Investido", value: formatCurrency(position.total_invested) },
          { label: "Valor Atual", value: formatCurrency(position.current_value) },
        ].map(({ label, key, value }) => (
          <div key={key ?? String(label)} className="card-haveres p-4">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="font-mono text-sm font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Gráfico de preços */}
      <PriceHistoryChart ticker={position.ticker} />

      {/* FII: dados do fundo (apenas para asset_type FII) */}
      {position.asset_type === "FII" && position.fii_detail && (
        <FIIDetailCard data={position.fii_detail} />
      )}

      {/* Fundamentalistas (ações, ETFs, BDRs) */}
      {position.asset_type !== "FII" && (
        <FundamentalsCard position={position} />
      )}

      {/* Demonstrações financeiras (ações, ETFs, BDRs — não FII/CRYPTO) */}
      {position.asset_type !== "FII" && position.asset_type !== "CRYPTO" && (
        <FinancialStatementsCard ticker={position.ticker} />
      )}

      {/* Cadeia de opções (apenas ações) */}
      {position.asset_type === "STOCK" && (
        <OptionsChainCard ticker={position.ticker} />
      )}
    </div>
  );
}
