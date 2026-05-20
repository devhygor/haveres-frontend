import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { portfolioApi } from "@/api/portfolio";
import { quotesApi } from "@/api/quotes";
import { FundamentalsCard } from "@/components/cards/FundamentalsCard";
import { FIIDetailCard } from "@/components/cards/FIIDetailCard";
import { FinancialStatementsCard } from "@/components/cards/FinancialStatementsCard";
import OptionsChainCard from "@/components/cards/OptionsChainCard";
import { AssetInfoCard } from "@/components/cards/AssetInfoCard";
import { PerformanceTableCard } from "@/components/cards/PerformanceTableCard";
import { DistributionSummaryCard } from "@/components/cards/DistributionSummaryCard";
import { InvestmentSimulator } from "@/components/cards/InvestmentSimulator";
import { MagicNumberSimulator } from "@/components/cards/MagicNumberSimulator";
import { DividendHistoryTable } from "@/components/tables/DividendHistoryTable";
import { DividendAmountChart } from "@/components/charts/DividendAmountChart";
import { BenchmarkComparisonChart } from "@/components/charts/BenchmarkComparisonChart";
import { PriceHistoryChart } from "@/components/charts/PriceHistoryChart";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { formatCurrency, formatPercent } from "@/utils/format";
import { plClass } from "@/utils/format";
import { cn } from "@/utils/cn";
import { AssetLogo } from "@/components/common/AssetLogo";
import { TermTooltip } from "@/components/common/TermTooltip";
import { ReferenceTimeHint } from "@/components/common/ReferenceTimeHint";

type TabKey = "overview" | "performance" | "distributions" | "comparison" | "simulators";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Visão Geral" },
  { key: "performance", label: "Rentabilidade" },
  { key: "distributions", label: "Distribuições" },
  { key: "comparison", label: "Comparação" },
  { key: "simulators", label: "Simuladores" },
];

export function AssetDetailPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [comparisonMonths, setComparisonMonths] = useState(60);

  const ticker_upper = ticker?.toUpperCase() ?? "";

  const summary = useQuery({
    queryKey: ["portfolio", "summary"],
    queryFn: () => portfolioApi.getSummary().then((r) => r.data),
  });

  const fiiDetailQuery = useQuery({
    queryKey: ["fii-detail", ticker_upper],
    queryFn: () => quotesApi.getFIIDetail(ticker_upper).then((r) => r.data),
    enabled: !!ticker_upper,
  });

  const performanceQuery = useQuery({
    queryKey: ["asset-performance", ticker_upper],
    queryFn: () => quotesApi.getAssetPerformance(ticker_upper).then((r) => r.data),
    enabled: !!ticker_upper,
  });

  const dividendHistoryQuery = useQuery({
    queryKey: ["dividend-history", ticker_upper],
    queryFn: () => quotesApi.getDividendHistory(ticker_upper).then((r) => r.data),
    enabled: !!ticker_upper,
  });

  const distributionQuery = useQuery({
    queryKey: ["distribution-summary", ticker_upper],
    queryFn: () => quotesApi.getDistributionSummary(ticker_upper).then((r) => r.data),
    enabled: !!ticker_upper,
  });

  const indexComparisonQuery = useQuery({
    queryKey: ["index-comparison", ticker_upper, comparisonMonths],
    queryFn: () => quotesApi.getIndexComparison(ticker_upper, comparisonMonths).then((r) => r.data),
    enabled: !!ticker_upper,
  });

  if (summary.isLoading) return <LoadingState />;
  if (summary.isError) return <ErrorState onRetry={() => summary.refetch()} />;

  const position = summary.data?.positions.find(
    (p) => p.ticker === ticker_upper
  );

  const fiiDetail = fiiDetailQuery.data;

  // Prefer position data, fallback via quotes/distribution APIs
  const currentPrice =
    position?.current_price ??
    (distributionQuery.data?.current_price ? parseFloat(distributionQuery.data.current_price) : null);
  const lastDividend =
    (distributionQuery.data?.last_dividend ? parseFloat(distributionQuery.data.last_dividend) : null) ??
    (fiiDetail?.last_dividend ? parseFloat(String(fiiDetail.last_dividend)) : null) ??
    null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <Link
          to="/dashboard"
          className="w-fit flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mt-1"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex items-center gap-3">
          {position && (
            <AssetLogo logoUrl={position.logo_url} ticker={position.ticker} size={40} />
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-mono">
              {ticker_upper}
            </h1>
            {position && (
              <p className="text-sm text-muted-foreground">{position.name}</p>
            )}
          </div>
        </div>
        {position && (
          <div className="sm:ml-auto text-left sm:text-right">
            <p className="text-xl sm:text-2xl font-bold text-white font-mono">
              {formatCurrency(position.current_price)}
            </p>
            <p className={cn("text-sm font-mono font-medium", plClass(position.pl_percent))}>
              {formatPercent(position.pl_percent, true)}
            </p>
          </div>
        )}
      </div>

      {/* Position stats — only when in portfolio */}
      {position && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Qtd", value: position.quantity },
            {
              label: <TermTooltip term="Preço Médio" />,
              key: "Preço Médio",
              value: formatCurrency(position.average_price),
            },
            {
              label: <TermTooltip term="Investido" />,
              key: "Investido",
              value: formatCurrency(position.total_invested),
            },
            {
              label: (
                <span className="inline-flex items-center gap-1.5">
                  Valor Atual
                  <ReferenceTimeHint asOf={position.pricing_reference_at} />
                </span>
              ),
              key: "Valor Atual",
              value: formatCurrency(position.current_value),
            },
          ].map(({ label, key, value }) => (
            <div key={key ?? String(label)} className="card-haveres p-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="font-mono text-sm font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-haveres-border overflow-x-auto pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-haveres-blue text-white"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Visão Geral */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <PriceHistoryChart ticker={ticker_upper} />

          {position?.asset_type === "FII" && position.fii_detail && (
            <FIIDetailCard data={position.fii_detail} />
          )}

          {position && position.asset_type !== "FII" && (
            <FundamentalsCard position={position} />
          )}

          {position &&
            position.asset_type !== "FII" &&
            position.asset_type !== "CRYPTO" && (
              <FinancialStatementsCard ticker={ticker_upper} />
            )}

          {position?.asset_type === "STOCK" && (
            <OptionsChainCard ticker={ticker_upper} />
          )}

          {fiiDetail && (
            <AssetInfoCard
              ticker={ticker_upper}
              name={fiiDetail.managed_by ?? ticker_upper}
              fii_type={fiiDetail.fii_type}
              fii_sector={fiiDetail.fii_sector}
              management_type={fiiDetail.management_type}
              management_fee={
                fiiDetail.management_fee !== null
                  ? String(fiiDetail.management_fee)
                  : null
              }
              total_investors={fiiDetail.total_investors}
              net_worth={
                fiiDetail.net_worth !== null ? String(fiiDetail.net_worth) : null
              }
              net_worth_per_share={
                fiiDetail.net_worth_per_share !== null
                  ? String(fiiDetail.net_worth_per_share)
                  : null
              }
              last_dividend={
                fiiDetail.last_dividend !== null
                  ? String(fiiDetail.last_dividend)
                  : null
              }
              pvp={fiiDetail.pvp !== null ? String(fiiDetail.pvp) : null}
            />
          )}
        </div>
      )}

      {/* Tab: Rentabilidade */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          {performanceQuery.isLoading && <LoadingState />}
          {performanceQuery.isError && (
            <ErrorState onRetry={() => performanceQuery.refetch()} />
          )}
          {performanceQuery.data && (
            <PerformanceTableCard data={performanceQuery.data} ticker={ticker_upper} />
          )}
        </div>
      )}

      {/* Tab: Distribuições */}
      {activeTab === "distributions" && (
        <div className="space-y-6">
          {distributionQuery.data && (
            <DistributionSummaryCard data={distributionQuery.data} />
          )}
          {dividendHistoryQuery.data && (
            <DividendAmountChart items={dividendHistoryQuery.data} />
          )}
          {dividendHistoryQuery.isLoading && <LoadingState />}
          {dividendHistoryQuery.isError && (
            <ErrorState onRetry={() => dividendHistoryQuery.refetch()} />
          )}
          {dividendHistoryQuery.data && (
            <DividendHistoryTable items={dividendHistoryQuery.data} />
          )}
        </div>
      )}

      {/* Tab: Comparação */}
      {activeTab === "comparison" && (
        <div className="space-y-6">
          {indexComparisonQuery.isLoading && <LoadingState />}
          {indexComparisonQuery.isError && (
            <ErrorState onRetry={() => indexComparisonQuery.refetch()} />
          )}
          {indexComparisonQuery.data && (
            <BenchmarkComparisonChart
              data={indexComparisonQuery.data}
              ticker={ticker_upper}
              months={comparisonMonths}
              onMonthsChange={setComparisonMonths}
            />
          )}
        </div>
      )}

      {/* Tab: Simuladores */}
      {activeTab === "simulators" && (
        <div className="space-y-6">
          <InvestmentSimulator ticker={ticker_upper} data={indexComparisonQuery.data} />
          <MagicNumberSimulator
            ticker={ticker_upper}
            currentPrice={currentPrice}
            lastDividend={lastDividend}
          />
        </div>
      )}
    </div>
  );
}
