import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError("");
    try {
      const res = await authApi.login(data);
      setTokens(res.data.access, res.data.refresh);
      const me = await authApi.me();
      setUser(me.data);
      navigate("/dashboard");
    } catch {
      setError("E-mail ou senha incorretos.");
    }
  }

  return (
    <div className="min-h-screen bg-haveres-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-haveres-blue to-haveres-green flex items-center justify-center mb-4 shadow-lg shadow-haveres-blue/20">
            <span className="text-white font-bold text-2xl">H</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Haveres</h1>
          <p className="text-muted-foreground text-sm mt-1">Controle de patrimônio pessoal</p>
        </div>

        <div className="card-haveres p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Entrar na conta</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">E-mail</label>
              <input
                {...register("email")}
                type="email"
                placeholder="seu@email.com"
                className="w-full bg-secondary border border-haveres-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-haveres-blue transition-colors"
              />
              {errors.email && <p className="text-xs text-loss mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Senha</label>
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full bg-secondary border border-haveres-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-haveres-blue transition-colors"
              />
              {errors.password && <p className="text-xs text-loss mt-1">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="bg-loss/10 border border-loss/20 rounded-lg px-3 py-2">
                <p className="text-sm text-loss">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-haveres-blue hover:bg-haveres-blue-dark text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Não tem conta?{" "}
            <Link to="/cadastro" className="text-haveres-blue hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          Os dados são apenas informativos e não constituem recomendação de investimento.
        </p>
      </div>
    </div>
  );
}
