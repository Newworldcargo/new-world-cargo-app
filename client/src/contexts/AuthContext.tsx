import { createContext, useContext, useMemo, useRef, useState } from "react";

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  provider: "password" | "google";
  verified: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<{ ok: boolean; reason?: "invalid" | "disabled" | "unverified" | "service" }>;
  register: (input: Omit<AuthUser, "id" | "provider" | "verified"> & { password: string }) => Promise<{ ok: boolean; reason?: "existing" | "service" }>;
  googleLogin: () => Promise<{ ok: boolean; needsProfile?: boolean; reason?: "cancelled" | "service" }>;
  verify: (code: string) => Promise<{ ok: boolean; reason?: "incomplete" | "incorrect" | "expired" | "attempts" }>;
  resendVerification: () => Promise<{ ok: boolean }>;
  resetPassword: (password: string) => Promise<{ ok: boolean }>;
  verifyCurrentPassword: (password: string) => Promise<{ ok: boolean }>;
  changePassword: (currentPassword: string, nextPassword: string) => Promise<{ ok: boolean; reason?: "current" | "new" }>;
  logout: () => void;
  updateUser: (input: Partial<Pick<AuthUser, "firstName" | "lastName" | "email" | "phone">>) => void;
  deleteAccount: () => Promise<{ ok: boolean }>;
};

const STORAGE_KEY = "nwc_mock_user";
const DEFAULT_USER: AuthUser = { id: "nwc-001", firstName: "Amina", lastName: "Mulenga", email: "amina@example.com", phone: "+260 97 000 0245", provider: "password", verified: true };

function readStoredUser() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as AuthUser | null; } catch { return null; }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const verifyAttempts = useRef(0);
  const persist = (next: AuthUser | null) => { setUser(next); if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); else localStorage.removeItem(STORAGE_KEY); };
  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    async login(identifier, password) {
      await new Promise(resolve => setTimeout(resolve, 350));
      if (!identifier || !password || password === "wrong") return { ok: false, reason: "invalid" };
      if (identifier.toLowerCase().includes("disabled")) return { ok: false, reason: "disabled" };
      if (identifier.toLowerCase().includes("unverified")) return { ok: false, reason: "unverified" };
      persist({ ...DEFAULT_USER, email: identifier.includes("@") ? identifier : DEFAULT_USER.email, provider: "password" });
      return { ok: true };
    },
    async register(input) {
      await new Promise(resolve => setTimeout(resolve, 350));
      if (input.email.toLowerCase().includes("existing")) return { ok: false, reason: "existing" };
      persist({ id: `nwc-${Date.now()}`, firstName: input.firstName, lastName: input.lastName, email: input.email, phone: input.phone, provider: "password", verified: false });
      return { ok: true };
    },
    async googleLogin() {
      await new Promise(resolve => setTimeout(resolve, 350));
      persist({ ...DEFAULT_USER, provider: "google" });
      return { ok: true };
    },
    async verify(code) {
      await new Promise(resolve => setTimeout(resolve, 250));
      if (verifyAttempts.current >= 3) return { ok: false, reason: "attempts" };
      if (code.length < 6) return { ok: false, reason: "incomplete" };
      if (code === "000000") return { ok: false, reason: "expired" };
      if (code !== "123456") {
        verifyAttempts.current += 1;
        return { ok: false, reason: verifyAttempts.current >= 3 ? "attempts" : "incorrect" };
      }
      verifyAttempts.current = 0;
      if (user) persist({ ...user, verified: true });
      return { ok: true };
    },
    async resendVerification() {
      await new Promise(resolve => setTimeout(resolve, 250));
      verifyAttempts.current = 0;
      return { ok: true };
    },
    async resetPassword(password) { await new Promise(resolve => setTimeout(resolve, 250)); return { ok: password.length >= 8 }; },
    async verifyCurrentPassword(password) { await new Promise(resolve => setTimeout(resolve, 250)); return { ok: password === "password123" }; },
    async changePassword(currentPassword, nextPassword) {
      await new Promise(resolve => setTimeout(resolve, 250));
      if (currentPassword !== "password123") return { ok: false, reason: "current" };
      if (nextPassword.length < 8 || nextPassword === currentPassword) return { ok: false, reason: "new" };
      return { ok: true };
    },
    logout() { persist(null); },
    updateUser(input) { if (user) persist({ ...user, ...input }); },
    async deleteAccount() { await new Promise(resolve => setTimeout(resolve, 350)); persist(null); return { ok: true }; },
  }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export const MOCK_OTP = "123456";
