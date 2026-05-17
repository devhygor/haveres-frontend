import { api } from "@/config/api";

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload {
  email: string; username: string; password: string;
  password_confirm: string; first_name?: string; last_name?: string;
}
export interface UserOut {
  id: number; email: string; username: string;
  first_name: string; last_name: string;
  full_name: string; display_name: string; avatar_url: string;
  is_email_verified: boolean;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<{ access: string; refresh: string }>("/token/pair", payload),

  refresh: (refresh: string) =>
    api.post<{ access: string }>("/token/refresh", { refresh }),

  register: (payload: RegisterPayload) =>
    api.post<UserOut>("/auth/register", payload),

  me: () => api.get<UserOut>("/auth/me"),

  updateProfile: (payload: Partial<Pick<UserOut, "first_name" | "last_name" | "display_name">>) =>
    api.put<UserOut>("/auth/me", payload),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return api.post<UserOut>("/auth/me/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  clearAccountData: () =>
    api.delete<{ message: string; deleted: Record<string, number> }>(
      "/auth/me/data",
      { data: { confirm: true } },
    ),
};
