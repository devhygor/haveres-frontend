import { api } from "@/config/api";
import type { HistoricalQuote, CurrencyQuote, MacroIndicator, BenchmarkPoint, FIIDetailData, CryptoQuoteItem, FinancialStatementItem, OptionContract, MarketIndexQuote } from "@/types/quote";
import type { AssetPerformance, DividendHistoryItem, DistributionSummary, IndexComparison } from "@/types/assetDetail";

export const quotesApi = {
  getHistory: (ticker: string, range = "1y") =>
    api.get<HistoricalQuote[]>(`/quotes/${ticker}/price-history`, { params: { range } }),

  getCurrencies: () =>
    api.get<CurrencyQuote[]>("/quotes/currencies"),

  syncCurrencies: () =>
    api.post("/quotes/currencies/sync"),

  getMacro: () =>
    api.get<MacroIndicator[]>("/quotes/macro"),

  getMarketIndices: () =>
    api.get<MarketIndexQuote[]>("/quotes/market-indices"),

  getBenchmark: (months = 12, assetType = "ALL") =>
    api.get<BenchmarkPoint[]>("/quotes/benchmark", { params: { months, asset_type: assetType } }),

  getFIIDetail: (ticker: string) =>
    api.get<FIIDetailData>(`/quotes/${ticker}/fii-detail`),

  getCryptoQuotes: (currency = "BRL") =>
    api.get<CryptoQuoteItem[]>("/quotes/crypto", { params: { currency } }),

  getFinancials: (ticker: string, statementType = "INCOME", periodType = "ANNUAL") =>
    api.get<FinancialStatementItem[]>(`/quotes/${ticker}/financials`, {
      params: { statement_type: statementType, period_type: periodType },
    }),

  getOptions: (ticker: string, expirationDate?: string) =>
    api.get<OptionContract[]>(`/quotes/${ticker}/options`, {
      params: expirationDate ? { expiration_date: expirationDate } : undefined,
    }),

  getAssetPerformance: (ticker: string) =>
    api.get<AssetPerformance>(`/quotes/${ticker}/performance`),

  getDividendHistory: (ticker: string, months = 36) =>
    api.get<DividendHistoryItem[]>(`/quotes/${ticker}/dividend-history`, { params: { months } }),

  getDistributionSummary: (ticker: string) =>
    api.get<DistributionSummary>(`/quotes/${ticker}/distribution-summary`),

  getIndexComparison: (ticker: string, months = 24) =>
    api.get<IndexComparison>(`/quotes/${ticker}/index-comparison`, { params: { months } }),
};
