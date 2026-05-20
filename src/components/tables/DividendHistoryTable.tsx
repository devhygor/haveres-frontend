import type { DividendHistoryItem } from "@/types/assetDetail";
import { formatDate } from "@/utils/format";

interface Props {
  items: DividendHistoryItem[];
}

export function DividendHistoryTable({ items }: Props) {
  if (!items.length) {
    return (
      <div className="card-haveres p-4 text-center text-muted-foreground text-sm">
        Nenhum histórico de dividendos disponível.
      </div>
    );
  }

  return (
    <div className="card-haveres overflow-hidden">
      <div className="p-4 border-b border-haveres-border">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Histórico de Distribuições
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-haveres-border bg-haveres-dark/50">
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Tipo</th>
              <th className="text-right px-4 py-2 text-muted-foreground font-medium">Data com</th>
              <th className="text-right px-4 py-2 text-muted-foreground font-medium">Pagamento</th>
              <th className="text-right px-4 py-2 text-muted-foreground font-medium">Valor / cota</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-haveres-border/40 hover:bg-haveres-card/60 transition-colors">
                <td className="px-4 py-2 text-white">{item.distribution_type}</td>
                <td className="px-4 py-2 text-right text-muted-foreground font-numeric">
                  {formatDate(item.ex_date)}
                </td>
                <td className="px-4 py-2 text-right text-muted-foreground font-numeric">
                  {item.payment_date ? formatDate(item.payment_date) : "—"}
                </td>
                <td className="px-4 py-2 text-right text-gain font-numeric font-medium">
                  R$ {parseFloat(item.value_per_share).toFixed(8).replace(/\.?0+$/, "").replace(/(\.\d{2})\d*/, "$1")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 text-xs text-muted-foreground border-t border-haveres-border/40">
        Total pago (12m): R$ {calcTotal12m(items)}
      </div>
    </div>
  );
}

function calcTotal12m(items: DividendHistoryItem[]): string {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const total = items
    .filter((i) => new Date(i.ex_date) >= cutoff)
    .reduce((acc, i) => acc + parseFloat(i.value_per_share), 0);
  return total.toFixed(2);
}
