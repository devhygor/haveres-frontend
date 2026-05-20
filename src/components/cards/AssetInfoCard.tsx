interface Props {
  ticker: string;
  name: string;
  cnpj?: string;
  fii_type?: string;
  fii_sector?: string;
  management_type?: string;
  management_fee?: string | null;
  total_investors?: number | null;
  shares_outstanding?: number | null;
  net_worth?: string | null;
  net_worth_per_share?: string | null;
  last_dividend?: string | null;
  pvp?: string | null;
}

export function AssetInfoCard({
  // ticker is part of the public API for callers but not used in the card body
  ticker: _ticker,
  name,
  cnpj,
  fii_type,
  fii_sector,
  management_type,
  management_fee,
  total_investors,
  shares_outstanding,
  net_worth,
  net_worth_per_share,
  last_dividend,
  pvp,
}: Props) {
  const rows = [
    { label: "Razão Social", value: name },
    cnpj ? { label: "CNPJ", value: cnpj } : null,
    fii_type ? { label: "Tipo de Fundo", value: fii_type } : null,
    fii_sector ? { label: "Segmento", value: fii_sector } : null,
    management_type ? { label: "Tipo de Gestão", value: management_type } : null,
    management_fee ? { label: "Taxa de Administração", value: `${parseFloat(management_fee).toFixed(2)}%` } : null,
    total_investors ? { label: "Número de Cotistas", value: total_investors.toLocaleString("pt-BR") } : null,
    shares_outstanding ? { label: "Cotas Emitidas", value: shares_outstanding.toLocaleString("pt-BR") } : null,
    net_worth_per_share ? { label: "Val. Patrimonial / Cota", value: `R$ ${parseFloat(net_worth_per_share).toFixed(2)}` } : null,
    net_worth ? { label: "Valor Patrimonial", value: formatNetWorth(net_worth) } : null,
    last_dividend ? { label: "Último Rendimento", value: `R$ ${parseFloat(last_dividend).toFixed(2)}` } : null,
    pvp ? { label: "P/VP", value: parseFloat(pvp).toFixed(2) } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="card-haveres p-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Informações do Fundo
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex flex-col py-1 border-b border-haveres-border/40 last:border-0">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-sm font-medium text-white font-numeric">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatNetWorth(value: string): string {
  const n = parseFloat(value);
  if (n >= 1e9) return `R$ ${(n / 1e9).toFixed(2)} Bilhões`;
  if (n >= 1e6) return `R$ ${(n / 1e6).toFixed(2)} Milhões`;
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}
