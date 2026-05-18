import { api } from "@/config/api";
import type { PortfolioSummary, AllocationItem, PatrimonyPoint, DividendsEvolution, ProjectedDividend } from "@/types/portfolio";

export const portfolioApi = {
  getSummary: () => api.get<PortfolioSummary>("/portfolio/summary"),
  getAllocationByType: () => api.get<AllocationItem[]>("/portfolio/allocation/by-type"),
  getAllocationBySector: () => api.get<AllocationItem[]>("/portfolio/allocation/by-sector"),
  getPatrimonyEvolution: (months = 12) =>
    api.get<PatrimonyPoint[]>(`/portfolio/evolution/patrimony?months=${months}`),
  getDividendsEvolution: (months = 12) =>
    api.get<DividendsEvolution[]>(`/portfolio/evolution/dividends?months=${months}`),
  getUpcomingDividends: () =>
    api.get<ProjectedDividend[]>("/portfolio/upcoming-dividends"),
};
