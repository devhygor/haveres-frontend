import { Link } from "react-router-dom";
import {
  TrendingUp,
  PieChart,
  Banknote,
  FileSpreadsheet,
  Building2,
  BarChart3,
  ChevronRight,
  Shield,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: PieChart,
    title: "Carteira Completa",
    description:
      "Ações, FIIs, ETFs, BDRs, renda fixa, Tesouro Direto e criptomoedas em um único painel. Alocação por setor em tempo real.",
    keywords: "carteira de investimentos, ações, FIIs, ETFs, BDRs",
  },
  {
    icon: TrendingUp,
    title: "Preço Médio Automático",
    description:
      "Preço médio ponderado calculado automaticamente a cada compra, venda, desdobramento, grupamento e bonificação.",
    keywords: "preço médio ações, cálculo preço médio",
  },
  {
    icon: Banknote,
    title: "Proventos e Dividendos",
    description:
      "Histórico completo de dividendos, JCP, rendimentos de FII e amortizações com IR retido na fonte.",
    keywords: "controle de dividendos, proventos, JCP, rendimento FII",
  },
  {
    icon: Building2,
    title: "Open Finance",
    description:
      "Conexão segura com suas contas bancárias via Open Finance. Tokens criptografados, nunca sua senha.",
    keywords: "open finance, conexão bancária",
  },
  {
    icon: FileSpreadsheet,
    title: "Importação de Notas",
    description:
      "Importe notas de corretagem em CSV ou Excel. Preview antes de confirmar — sem surpresas.",
    keywords: "importar notas de corretagem, CSV, Excel",
  },
  {
    icon: BarChart3,
    title: "Indicadores Fundamentalistas",
    description:
      "P/VP, Dividend Yield, LPA, P/L e 20+ indicadores atualizados automaticamente via integração com Brapi.",
    keywords: "indicadores fundamentalistas, P/VP, dividend yield, LPA",
  },
];

const stats = [
  { value: "8+", label: "tipos de ativo" },
  { value: "7", label: "tipos de transação" },
  { value: "20+", label: "indicadores rastreados" },
  { value: "100%", label: "seus dados" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-haveres-dark text-white">
      {/* Nav */}
      <nav className="border-b border-haveres-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/static/android-chrome-192x192.png"
              alt="Haveres"
              className="w-7 h-7 rounded-lg"
            />
            <span className="font-bold text-white">Haveres</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="text-sm bg-haveres-blue hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-haveres-blue/10 border border-haveres-blue/20 rounded-full px-3 py-1 text-xs text-haveres-blue mb-6">
          <Zap className="w-3 h-3" />
          Gratuito · Open Finance · Cotações em tempo real
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4">
          Controle sua{" "}
          <span className="text-haveres-blue">carteira de investimentos</span>
          <br className="hidden sm:block" /> com inteligência
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Acompanhe ações, FIIs, ETFs, renda fixa e criptomoedas em um só lugar.
          Preço médio automático, histórico de proventos, P&L e integração com Open Finance.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/cadastro"
            className="flex items-center gap-2 bg-haveres-blue hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
          >
            Criar conta grátis
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="text-sm text-muted-foreground hover:text-white transition-colors"
          >
            Já tenho conta → entrar
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-haveres-border/50 bg-haveres-card/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-haveres-blue font-numeric">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
          Tudo que você precisa para controlar seu patrimônio
        </h2>
        <p className="text-muted-foreground text-center mb-10 text-sm">
          Do preço médio ao dividend yield — sem planilha, sem esforço.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <article
              key={f.title}
              className="card-haveres p-5 hover:border-haveres-blue/40 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-haveres-blue/10 flex items-center justify-center mb-3">
                <f.icon className="w-4 h-4 text-haveres-blue" />
              </div>
              <h3 className="font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Security note */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="card-haveres p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-gain/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-gain" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Seus dados, sua privacidade</h3>
            <p className="text-sm text-muted-foreground">
              Nunca armazenamos senhas bancárias ou de corretoras. Tokens Open Finance são
              criptografados. Seus dados financeiros pertencem só a você.
            </p>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-haveres-border/50 bg-haveres-card/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
            Comece a controlar seus investimentos hoje
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Gratuito. Sem cartão de crédito. Configure em minutos.
          </p>
          <Link
            to="/cadastro"
            className="inline-flex items-center gap-2 bg-haveres-blue hover:bg-blue-600 text-white font-medium px-8 py-3 rounded-xl transition-colors"
          >
            Criar conta grátis
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-haveres-border/50 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Haveres — Controle de carteira de investimentos e patrimônio pessoal
      </footer>
    </div>
  );
}
