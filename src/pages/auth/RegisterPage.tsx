import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { authApi } from "@/api/auth";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  username: z.string().min(3, "Mínimo 3 caracteres"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  password_confirm: z.string(),
}).refine((d) => d.password === d.password_confirm, {
  message: "As senhas não coincidem",
  path: ["password_confirm"],
});

type FormData = z.infer<typeof schema>;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-muted-foreground mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-loss mt-1">{error}</p>}
    </div>
  );
}

const inputClass = "w-full bg-secondary border border-haveres-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-haveres-blue transition-colors";

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectTimeoutRef = useRef<number | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  async function onSubmit(data: FormData) {
    setError("");
    setSuccess("");
    setIsRedirecting(false);
    if (redirectTimeoutRef.current) {
      window.clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    try {
      await authApi.register(data);
      setSuccess("Cadastro realizado com sucesso! Redirecionando para o login...");
      setIsRedirecting(true);
      redirectTimeoutRef.current = window.setTimeout(() => {
        navigate("/login", { state: { registered: true } });
      }, 1400);
    } catch (e: any) {
      setIsRedirecting(false);
      setError(e?.response?.data?.detail || "Erro ao criar conta. Tente novamente.");
    }
  }

  return (
    <div className="min-h-screen bg-haveres-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/static/android-chrome-192x192.png"
            alt="Haveres"
            className="w-14 h-14 mx-auto rounded-2xl mb-4 shadow-lg shadow-haveres-blue/20"
          />
          <h1 className="text-xl sm:text-2xl font-bold text-white">Haveres</h1>
          <p className="text-muted-foreground text-sm mt-1">Crie sua conta</p>
        </div>

        <div className="card-haveres p-5 sm:p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Cadastro</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="E-mail" error={errors.email?.message}>
              <input {...register("email")} type="email" placeholder="seu@email.com" className={inputClass} />
            </Field>
            <Field label="Username" error={errors.username?.message}>
              <input {...register("username")} placeholder="seunome" className={inputClass} />
            </Field>
            <Field label="Senha" error={errors.password?.message}>
              <input {...register("password")} type="password" placeholder="Mínimo 8 caracteres" className={inputClass} />
            </Field>
            <Field label="Confirmar senha" error={errors.password_confirm?.message}>
              <input {...register("password_confirm")} type="password" placeholder="••••••••" className={inputClass} />
            </Field>

            {error && (
              <div className="bg-loss/10 border border-loss/20 rounded-lg px-3 py-2">
                <p className="text-sm text-loss">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-gain/10 border border-gain/30 rounded-lg px-3 py-2">
                <p className="text-sm text-gain">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isRedirecting}
              className="w-full bg-haveres-blue hover:bg-haveres-blue-dark text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-2"
            >
              {isSubmitting ? "Criando conta..." : isRedirecting ? "Cadastro concluído" : "Criar conta"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem conta?{" "}
            <Link to="/login" className="text-haveres-blue hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
