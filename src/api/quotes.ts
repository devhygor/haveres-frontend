import { api } from "@/config/api";
import type { HistoricalQuote, CurrencyQuote, MacroIndicator, BenchmarkPoint, FIIDetailData, CryptoQuoteItem } from "@/types/quote";

export const quotesApi = {
  getHistory: (ticker: string, range = "1y") =>
    api.get<HistoricalQuote[]>(`/quotes/${ticker}/price-history`, { params: { range } }),

  getCurrencies: () =>
    api.get<CurrencyQuote[]>("/quotes/currencies"),

  syncCurrencies: () =>
    api.post("/quotes/currencies/sync"),

  getMacro: () =>
    api.get<MacroIndicator[]>("/quotes/macro"),

  getBenchmark: (months = 12) =>
    api.get<BenchmarkPoint[]>("/quotes/benchmark", { params: { months } }),

  getFIIDetail: (ticker: string) =>
    api.get<FIIDetailData>(`/quotes/${ticker}/fii-detail`),

  getCryptoQuotes: (currency = "BRL") =>
    api.get<CryptoQuoteItem[]>("/quotes/crypto", { params: { currency } }),
};
