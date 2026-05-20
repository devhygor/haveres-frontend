import { api } from "@/config/api";
import type {
  PortfolioSummary,
  AllocationItem,
  PatrimonyPoint,
  DividendsEvolution,
  ProjectedDividend,
  SaveTargetAllocationPayload,
  SaveTargetAllocationResult,
  SaveMaxBuyPricePayload,
  SaveMaxBuyPriceResult,
  ContributionSimulationPayload,
  ContributionSimulationResult,
} from "@/types/portfolio";

export const portfolioApi = {
  getSummary: () => api.get<PortfolioSummary>("/portfolio/summary"),
  getAllocationByType: () => api.get<AllocationItem[]>("/portfolio/allocation/by-type"),
  getAllocationBySector: () => api.get<AllocationItem[]>("/portfolio/allocation/by-sector"),
  getPatrimonyEvolution: (months = 12, assetType?: string) => {
    const params = new URLSearchParams({ months: String(months) });
    if (assetType) params.append("asset_type", assetType);
    return api.get<PatrimonyPoint[]>(`/portfolio/evolution/patrimony?${params}`);
  },
  getDividendsEvolution: (months = 12) =>
    api.get<DividendsEvolution[]>(`/portfolio/evolution/dividends?months=${months}`),
  getUpcomingDividends: () =>
    api.get<ProjectedDividend[]>("/portfolio/upcoming-dividends"),
  saveTargetAllocation: (payload: SaveTargetAllocationPayload) =>
    api.put<SaveTargetAllocationResult>("/portfolio/target-allocation", payload),
  saveMaxBuyPrice: (payload: SaveMaxBuyPricePayload) =>
    api.put<SaveMaxBuyPriceResult>("/portfolio/max-buy-price", payload),
  simulateContributionPlan: (payload: ContributionSimulationPayload) =>
    api.post<ContributionSimulationResult>("/portfolio/contribution-plan", payload),
};
