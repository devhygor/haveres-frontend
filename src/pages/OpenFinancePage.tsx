import { Building2, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

export function OpenFinancePage() {
  return (
    <div className="space-y-6">
      <div className="card-haveres p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="text-gain mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">Conexão segura via Open Finance</p>
            <p className="text-xs text-muted-foreground mt-1">
              O Haveres nunca armazena suas senhas bancárias. Toda integração é feita via consentimento
              oficial através de provedores homologados. Você pode revogar o acesso a qualquer momento.
            </p>
          </div>
        </div>
      </div>

      <div className="card-haveres">
        <div className="flex items-center gap-2 p-5 border-b border-haveres-border">
          <Building2 size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white">Instituições conectadas</h2>
        </div>
        <EmptyState
          icon={Building2}
          title="Nenhuma conta conectada"
          description="Conecte suas contas bancárias via Open Finance para visualizar saldos e transações."
        />
      </div>
    </div>
  );
}
