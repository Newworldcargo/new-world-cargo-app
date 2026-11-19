import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authGateway, type AuthUser } from "@/api/auth-gateway";
import { customerQueryClient } from "@/api/query-client";
import { clearSupplierForm } from "@/lib/supplier-payment-draft";
import { CUSTOMER_SESSION_REJECTED, isPublicAuthPath } from "@/lib/auth-workflow";
import { useCustomerWorkflowStore } from "@/stores/customer-workflow-store";

export type { AuthUser } from "@/api/auth-gateway";
type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  sessionError: boolean;
  retrySession: () => void;
  login: (identifier: string, password: string) => ReturnType<typeof authGateway.login>;
  register: (input: Omit<AuthUser, "id" | "provider" | "verified"> & { password: string }) => ReturnType<typeof authGateway.register>;
  googleLogin: (credential: string) => ReturnType<typeof authGateway.googleLogin>;
  verify: (code: string) => ReturnType<typeof authGateway.verify>;
  resendVerification: () => ReturnType<typeof authGateway.resendVerification>;
  requestPasswordReset: (identifier: string) => ReturnType<typeof authGateway.requestPasswordReset>;
  resetPassword: (input: { identifier: string; code: string; password: string; passwordConfirmation: string }) => ReturnType<typeof authGateway.resetPassword>;
  verifyCurrentPassword: (password: string) => ReturnType<typeof authGateway.verifyCurrentPassword>;
  changePassword: (currentPassword: string, nextPassword: string) => ReturnType<typeof authGateway.changePassword>;
  logout: () => Promise<void>;
  updateUser: (input: Partial<Pick<AuthUser, "firstName" | "lastName" | "email" | "phone" | "avatar">>) => void;
  deleteAccount: () => ReturnType<typeof authGateway.deleteAccount>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState(false);
  const [sessionAttempt, setSessionAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const pathname = typeof window === "undefined" ? "/" : window.location.pathname;
    if (isPublicAuthPath(pathname)) {
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    setSessionError(false);
    authGateway.getSession().then((session) => { if (active) setUser(session); }).catch(() => { if (active) setSessionError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [sessionAttempt]);
  useEffect(() => {
    if (!user?.verified) return;
    let active = true;
    let checking = false;
    const checkSession = async () => {
      if (checking || document.hidden || !navigator.onLine || isPublicAuthPath(window.location.pathname)) return;
      checking = true;
      try {
        const session = await authGateway.getSession();
        if (active && !session) {
          setUser(null);
          customerQueryClient.clear();
          useCustomerWorkflowStore.getState().clearCustomerWorkflowState();
        }
      } catch {
        // A failed connection does not establish that the session has ended.
      } finally {
        checking = false;
      }
    };
    const events = ["focus", "online", CUSTOMER_SESSION_REJECTED];
    for (const event of events) window.addEventListener(event, checkSession);
    document.addEventListener("visibilitychange", checkSession);
    return () => {
      active = false;
      for (const event of events) window.removeEventListener(event, checkSession);
      document.removeEventListener("visibilitychange", checkSession);
    };
  }, [user?.id, user?.verified]);

  const value = useMemo<AuthContextValue>(() => ({
    user, loading, sessionError, isAuthenticated: Boolean(user), retrySession: () => setSessionAttempt((attempt) => attempt + 1),
    async login(identifier, password) { const result = await authGateway.login(identifier, password); if (result.ok && result.user) setUser(result.user); return result; },
    async register(input) { const result = await authGateway.register(input); if (result.ok && result.user) setUser(result.user); return result; },
    async googleLogin(credential) { const result = await authGateway.googleLogin(credential); if (result.ok && result.user) setUser(result.user); return result; },
    async verify(code) { const result = await authGateway.verify(code); if (result.ok) setUser((current) => current ? { ...current, verified: true } : current); return result; }, resendVerification: () => authGateway.resendVerification(), requestPasswordReset: (identifier) => authGateway.requestPasswordReset(identifier), resetPassword: (input) => authGateway.resetPassword(input), verifyCurrentPassword: (password) => authGateway.verifyCurrentPassword(password), changePassword: (currentPassword, nextPassword) => authGateway.changePassword(currentPassword, nextPassword),
    async logout() { await authGateway.logout(); clearSupplierForm(); setUser(null); customerQueryClient.clear(); useCustomerWorkflowStore.getState().clearCustomerWorkflowState(); },
    updateUser(input) { const previous = user; if (previous) setUser({ ...previous, ...input }); void authGateway.updateProfile(input).then(setUser).catch(() => setUser(previous)); },
    async deleteAccount() { const result = await authGateway.deleteAccount(); if (result.ok) { clearSupplierForm(); setUser(null); customerQueryClient.clear(); useCustomerWorkflowStore.getState().clearCustomerWorkflowState(); } return result; },
  }), [loading, sessionError, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used within AuthProvider"); return context; }
export const MOCK_OTP = "123456";
