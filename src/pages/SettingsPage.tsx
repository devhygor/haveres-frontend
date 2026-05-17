import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/api/auth";
import { useState } from "react";
import { Settings } from "lucide-react";

const profileSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  display_name: z.string(),
});
type ProfileData = z.infer<typeof profileSchema>;

const inputClass = "w-full bg-secondary border border-haveres-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-haveres-blue transition-colors";

export function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.full_name?.split(" ")[0] ?? "",
      last_name: user?.full_name?.split(" ").slice(1).join(" ") ?? "",
      display_name: "",
    },
  });

  async function onSubmit(data: ProfileData) {
    const res = await authApi.updateProfile(data);
    setUser(res.data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="card-haveres p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings size={18} className="text-haveres-blue" />
          <h2 className="text-sm font-semibold text-white">Perfil</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Nome</label>
            <input {...register("first_name")} className={inputClass} placeholder="Seu nome" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Sobrenome</label>
            <input {...register("last_name")} className={inputClass} placeholder="Seu sobrenome" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">E-mail</label>
            <input value={user?.email ?? ""} disabled className={inputClass + " opacity-50 cursor-not-allowed"} />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-haveres-blue hover:bg-haveres-blue-dark text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
            {saved && <span className="text-xs text-gain">Perfil atualizado!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
