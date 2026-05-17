# Haveres Frontend

Dashboard de carteira de investimentos e patrimônio pessoal.

**Stack:** React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · TanStack Query · TanStack Table · Recharts · React Router v6 · Zustand

---

## Início rápido

```bash
# 1. Configure o ambiente
cp .env.example .env

# 2. Instale dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev

# Acesse: http://localhost:5173
```

O frontend consome a API em `VITE_API_URL` (padrão: `http://localhost:8000/api`). O backend deve estar rodando antes de usar o sistema.

---

## Estrutura

```
src/
├── api/              # Funções de chamada à API (auth, portfolio, transactions…)
├── components/
│   ├── layout/       # AppLayout, Sidebar, Header
│   ├── cards/        # StatCard, PLCard
│   ├── charts/       # PatrimonyChart, AllocationChart, DividendsChart
│   ├── tables/       # PositionsTable (TanStack Table)
│   └── common/       # LoadingState, ErrorState, EmptyState
├── config/           # Axios instance, QueryClient
├── pages/
│   ├── auth/         # LoginPage, RegisterPage
│   ├── DashboardPage # Dashboard principal com todos os cards e gráficos
│   ├── PortfolioPage # Posições e alocação
│   ├── TransactionsPage
│   ├── DividendsPage
│   ├── ImportsPage
│   ├── OpenFinancePage
│   ├── SettingsPage
│   └── SystemPage    # Health check e status de integrações
├── stores/           # Zustand: authStore (JWT), uiStore (sidebar)
├── types/            # Interfaces TypeScript (portfolio, transaction, dividend, asset)
└── utils/            # format.ts (moeda, %, data), cn.ts
```

## Identidade visual

- **Fundo:** `#0f1117` (haveres-dark)
- **Cards:** `#1a1f2e` (haveres-card) com borda `#2d3748`
- **Azul:** `#3b82f6` — navegação, botões, gráficos, links
- **Verde:** `#22c55e` — ganhos, dividendos, rentabilidade positiva
- **Vermelho:** `#ef4444` — perdas, quedas, alertas

## Autenticação

JWT com refresh automático via interceptor Axios. Tokens persistidos via Zustand + `localStorage`. Rotas protegidas por `ProtectedRoute` em `App.tsx`.

## Variáveis de ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `VITE_API_URL` | URL base da API backend | `http://localhost:8000/api` |
