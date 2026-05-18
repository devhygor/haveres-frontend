# CLAUDE.md — haveres-frontend

## Stack
React 18 · Vite · TypeScript · Tailwind CSS · TanStack Query v5 · TanStack Table v8 · Recharts · React Router v6 · React Hook Form + Zod · Axios · Zustand · Lucide React

## Comandos

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

Variável obrigatória: `VITE_API_URL=http://localhost:8000/api` (copiar de `.env.example`)

## Arquitetura

| Pasta | Conteúdo |
|---|---|
| `src/api/` | Funções Axios por domínio: auth, portfolio, transactions, dividends, system |
| `src/config/api.ts` | Instância Axios com interceptor JWT + refresh automático em 401 |
| `src/stores/` | authStore (Zustand+persist: tokens + user), uiStore (sidebar) |
| `src/types/` | Interfaces TypeScript: portfolio, transaction, dividend, asset |
| `src/utils/format.ts` | `formatCurrency`, `formatPercent`, `formatDate`, `plClass` |
| `src/utils/cn.ts` | `cn()` = clsx + tailwind-merge |
| `src/components/charts/` | PatrimonyChart (area), DividendsChart (bar), AllocationChart (donut) |
| `src/components/tables/` | PositionsTable com TanStack Table + sort |
| `src/components/cards/` | StatCard, PLCard |
| `src/components/common/` | LoadingState, SkeletonCard, ErrorState, EmptyState |

## Identidade visual (imutável)

| Token | Hex | Uso |
|---|---|---|
| `haveres-dark` | `#0f1117` | Fundo principal |
| `haveres-card` | `#1a1f2e` | Background de cards |
| `haveres-border` | `#2d3748` | Bordas |
| `haveres-blue` | `#3b82f6` | Botões, navegação, gráficos |
| `gain` | `#22c55e` | Positivo → `text-gain` |
| `loss` | `#ef4444` | Negativo → `text-loss` |
| `chart-hover-soft` | `rgba(160, 174, 192, 0.12)` | Destaque sutil no hover de gráficos |

## Convenções obrigatórias

- Valores monetários: sempre `formatCurrency(value)` — nunca inline
- P&L: sempre `plClass(value)` → `text-gain` / `text-loss` / `text-muted-foreground`
- Dados financeiros: sempre `font-numeric` (`font-mono tabular-nums`)
- Cards: classe utilitária `card-haveres` (`bg-haveres-card border border-haveres-border rounded-xl`)
- Gráficos Recharts: hover com destaque sutil via `Tooltip cursor={{ fill: "rgba(160, 174, 192, 0.12)" }}` (evitar `cursor={false}`)

## Auth flow

Login → `authApi.login()` → `setTokens()` → `authApi.me()` → `setUser()` → redirect `/dashboard`.
Refresh automático no interceptor Axios (`src/config/api.ts`) quando retorna 401.
