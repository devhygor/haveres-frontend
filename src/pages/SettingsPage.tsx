import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Camera, Database, AlertTriangle, Trash2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/api/auth";

const profileSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  display_name: z.string(),
});
type ProfileData = z.infer<typeof profileSchema>;

const INPUT = "w-full bg-secondary border border-haveres-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-haveres-blue transition-colors";

export function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [profileSaved, setProfileSaved] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState("");
  const [clearResult, setClearResult] = useState<Record<string, number> | null>(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.full_name?.split(" ")[0] ?? "",
      last_name: user?.full_name?.split(" ").slice(1).join(" ") ?? "",
      display_name: "",
    },
  });

  async function onSubmitProfile(data: ProfileData) {
    const res = await authApi.updateProfile(data);
    setUser(res.data);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => authApi.uploadAvatar(file),
    onSuccess: (res) => {
      setUser(res.data);
      setAvatarError("");
    },
    onError: () => setAvatarError("Erro ao enviar imagem. Use JPEG, PNG ou WebP (máx 2MB)."),
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    uploadAvatar.mutate(file);
  }

  const clearData = useMutation({
    mutationFn: () => authApi.clearAccountData(),
    onSuccess: (res) => {
      setClearResult(res.data.deleted);
      setShowClearModal(false);
      setClearConfirmText("");
      qc.invalidateQueries();
    },
  });

  const initials = user?.full_name
    ? user.full_name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="max-w-xl space-y-6">

      {/* Perfil */}
      <div className="card-haveres p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white">Perfil</h2>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="w-16 h-16 rounded-full overflow-hidden border-2 border-haveres-border hover:border-haveres-blue transition-colors focus:outline-none relative"
              title="Alterar foto"
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-haveres-blue/20 flex items-center justify-center text-haveres-blue font-bold text-xl">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera size={16} className="text-white" />
              </div>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="text-sm text-white font-medium">{user?.full_name || user?.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {uploadAvatar.isPending ? "Enviando..." : "Clique no avatar para alterar"}
            </p>
            {avatarError && <p className="text-xs text-loss mt-1">{avatarError}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Nome</label>
            <input {...register("first_name")} className={INPUT} placeholder="Seu nome" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Sobrenome</label>
            <input {...register("last_name")} className={INPUT} placeholder="Seu sobrenome" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">E-mail</label>
            <input value={user?.email ?? ""} disabled className={INPUT + " opacity-50 cursor-not-allowed"} />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-haveres-blue hover:bg-haveres-blue-dark text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
            {profileSaved && <span className="text-xs text-gain">Perfil atualizado!</span>}
          </div>
        </form>
      </div>

      {/* Dados da Conta */}
      <div className="card-haveres p-6">
        <div className="flex items-center gap-2 mb-2">
          <Database size={18} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-white">Dados da Conta</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Gerencie os dados vinculados à sua conta.
        </p>

        {clearResult && (
          <div className="mb-4 rounded-lg border border-gain/30 bg-gain/5 p-3 text-xs text-gain space-y-0.5">
            <p className="font-semibold mb-1">Dados removidos com sucesso.</p>
            {Object.entries(clearResult).map(([k, v]) => (
              <p key={k} className="text-muted-foreground">{k}: {v} registros</p>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-loss/30 bg-loss/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-loss mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Limpar todos os registros</p>
              <p className="text-xs text-muted-foreground mt-1">
                Remove todas as movimentações, proventos, lotes de importação, snapshots e conexões Open Finance.
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <button
              onClick={() => { setShowClearModal(true); setClearConfirmText(""); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-loss/40 text-loss text-xs font-medium hover:bg-loss/10 transition-colors flex-shrink-0"
            >
              <Trash2 size={12} /> Limpar...
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de limpeza */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card-haveres w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-loss" />
              <h3 className="text-sm font-semibold text-white">Tem certeza que deseja continuar?</h3>
            </div>

            <p className="text-xs text-muted-foreground">Esta ação apagará permanentemente:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Todas as movimentações</li>
              <li>Todos os proventos</li>
              <li>Todos os lotes de importação</li>
              <li>Todas as conexões Open Finance</li>
              <li>Todos os snapshots de portfólio</li>
            </ul>

            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Digite <span className="font-mono font-bold text-loss">LIMPAR</span> para confirmar:
              </label>
              <input
                type="text"
                autoFocus
                className={INPUT}
                placeholder="LIMPAR"
                value={clearConfirmText}
                onChange={e => setClearConfirmText(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowClearModal(false); setClearConfirmText(""); }}
                className="flex-1 py-2 rounded-lg border border-haveres-border text-sm text-muted-foreground hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => clearData.mutate()}
                disabled={clearConfirmText !== "LIMPAR" || clearData.isPending}
                className="flex-1 py-2 rounded-lg bg-loss text-white text-sm font-medium hover:bg-loss/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {clearData.isPending ? "Apagando..." : "Confirmar e Apagar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
