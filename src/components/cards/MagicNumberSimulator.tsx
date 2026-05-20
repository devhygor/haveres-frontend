import { useState } from "react";
import { formatCurrency } from "@/utils/format";

interface Props {
  ticker: string;
  currentPrice: number | null;
  lastDividend: number | null;
}

export function MagicNumberSimulator({ ticker, currentPrice, lastDividend }: Props) {
  const [price, setPrice] = useState(currentPrice ?? 0);
  const [dividend, setDividend] = useState(lastDividend ?? 0);

  const magicNumber = dividend > 0 ? Math.ceil(price / dividend) : null;
  const totalInvestment = magicNumber ? magicNumber * price : null;

  return (
    <div className="card-haveres p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Simulador Magic Number — {ticker}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Quantidade de cotas necessária para que os dividendos de 1 mês paguem 1 nova cota
          (efeito bola de neve).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Preço da cota</label>
          <div className="flex items-center gap-1 bg-haveres-dark border border-haveres-border rounded-lg px-3 py-2">
            <span className="text-muted-foreground text-xs">R$</span>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="bg-transparent text-white font-numeric text-sm w-full outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Rendimento mensal / cota
          </label>
          <div className="flex items-center gap-1 bg-haveres-dark border border-haveres-border rounded-lg px-3 py-2">
            <span className="text-muted-foreground text-xs">R$</span>
            <input
              type="number"
              step="0.01"
              value={dividend}
              onChange={(e) => setDividend(parseFloat(e.target.value) || 0)}
              className="bg-transparent text-white font-numeric text-sm w-full outline-none"
            />
          </div>
        </div>
      </div>

      {magicNumber !== null ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-haveres-dark rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Magic Number</p>
            <p className="text-2xl font-bold text-haveres-blue font-numeric">{magicNumber}</p>
            <p className="text-xs text-muted-foreground mt-0.5">cotas</p>
          </div>
          <div className="bg-haveres-dark rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Investimento total</p>
            <p className="text-lg font-bold text-white font-numeric">
              {formatCurrency(totalInvestment!)}
            </p>
          </div>
          <div className="bg-haveres-dark rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Renda / mês</p>
            <p className="text-lg font-bold text-gain font-numeric">
              {formatCurrency(magicNumber * dividend)}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Informe o rendimento mensal para calcular.
        </p>
      )}
    </div>
  );
}
