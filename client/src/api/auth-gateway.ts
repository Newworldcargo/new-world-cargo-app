import { CustomerApiError } from "./errors";
import { apiRequest } from "./http";
import { portalDataMode } from "./repository";

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  provider: "password" | "google";
  verified: boolean;
};

type LoginResult = { ok: boolean; reason?: "invalid" | "disabled" | "unverified" | "service"; user?: AuthUser };
type RegisterResult = { ok: boolean; reason?: "existing" | "service"; user?: AuthUser };
type GoogleResult = { ok: boolean; needsProfile?: boolean; reason?: "cancelled" | "service"; user?: AuthUser };
type VerificationResult = { ok: boolean; reason?: "incomplete" | "incorrect" | "expired" | "attempts" };

export interface AuthGateway {
  getSession(): Promise<AuthUser | null>;
  login(identifier: string, password: string): Promise<LoginResult>;
  register(input: Omit<AuthUser, "id" | "provider" | "verified"> & { password: string }): Promise<RegisterResult>;
  googleLogin(): Promise<GoogleResult>;
  verify(code: string): Promise<VerificationResult>;
  resendVerification(): Promise<{ ok: boolean }>;
  resetPassword(password: string): Promise<{ ok: boolean }>;
  verifyCurrentPassword(password: string): Promise<{ ok: boolean }>;
  changePassword(currentPassword: string, nextPassword: string): Promise<{ ok: boolean; reason?: "current" | "new" }>;
  logout(): Promise<void>;
  updateProfile(input: Partial<Pick<AuthUser, "firstName" | "lastName" | "email" | "phone" | "avatar">>): Promise<AuthUser>;
  deleteAccount(): Promise<{ ok: boolean }>;
}

const STORAGE_KEY = "nwc_mock_user";
const DEFAULT_USER: AuthUser = { id: "nwc-001", firstName: "Amina", lastName: "Mulenga", email: "amina@example.com", phone: "+260 97 000 0245", provider: "password", verified: true };
const pause = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
const stored = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as AuthUser | null; } catch { return null; } };
const persist = (user: AuthUser | null) => { if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); else localStorage.removeItem(STORAGE_KEY); };

const mockAuthGateway: AuthGateway = {
  async getSession() { return stored(); },
  async login(identifier, password) { await pause(250); if (!identifier || !password || password === "wrong") return { ok: false, reason: "invalid" }; if (identifier.toLowerCase().includes("disabled")) return { ok: false, reason: "disabled" }; if (identifier.toLowerCase().includes("unverified")) return { ok: false, reason: "unverified" }; const user = { ...DEFAULT_USER, email: identifier.includes("@") ? identifier : DEFAULT_USER.email, provider: "password" as const }; persist(user); return { ok: true, user }; },
  async register(input) { await pause(250); if (input.email.toLowerCase().includes("existing")) return { ok: false, reason: "existing" }; const user: AuthUser = { id: `nwc-${Date.now()}`, firstName: input.firstName, lastName: input.lastName, email: input.email, phone: input.phone, provider: "password", verified: false }; persist(user); return { ok: true, user }; },
  async googleLogin() { await pause(250); const user = { ...DEFAULT_USER, provider: "google" as const }; persist(user); return { ok: true, user }; },
  async verify(code) { await pause(150); if (code.length < 6) return { ok: false, reason: "incomplete" }; if (code === "000000") return { ok: false, reason: "expired" }; if (code !== "123456") return { ok: false, reason: "incorrect" }; const user = stored(); if (user) persist({ ...user, verified: true }); return { ok: true }; },
  async resendVerification() { await pause(150); return { ok: true }; },
  async resetPassword(password) { await pause(150); return { ok: password.length >= 8 }; },
  async verifyCurrentPassword(password) { await pause(150); return { ok: password === "password123" }; },
  async changePassword(currentPassword, nextPassword) { await pause(150); if (currentPassword !== "password123") return { ok: false, reason: "current" }; return nextPassword.length >= 8 && nextPassword !== currentPassword ? { ok: true } : { ok: false, reason: "new" }; },
  async logout() { persist(null); },
  async updateProfile(input) { const user = stored() ?? DEFAULT_USER; const next = { ...user, ...input }; persist(next); return next; },
  async deleteAccount() { await pause(250); persist(null); return { ok: true }; },
};

function authReason(error: unknown): "invalid" | "disabled" | "unverified" | "service" {
  if (!(error instanceof CustomerApiError)) return "service";
  if (error.code === "ACCOUNT_DISABLED") return "disabled";
  if (error.code === "CONTACT_UNVERIFIED") return "unverified";
  return error.status === 401 ? "invalid" : "service";
}

const httpAuthGateway: AuthGateway = {
  async getSession() { try { return await apiRequest<AuthUser>("/session"); } catch (error) { if (error instanceof CustomerApiError && error.status === 401) return null; throw error; } },
  async login(identifier, password) { try { return { ok: true, user: await apiRequest<AuthUser>("/auth/login", { method: "POST", body: { identifier, password } }) }; } catch (error) { return { ok: false, reason: authReason(error) }; } },
  async register(input) { try { return { ok: true, user: await apiRequest<AuthUser>("/auth/register", { method: "POST", body: input }) }; } catch (error) { return { ok: false, reason: error instanceof CustomerApiError && error.code === "ACCOUNT_EXISTS" ? "existing" : "service" }; } },
  async googleLogin() { return { ok: false, reason: "service" }; },
  async verify(code) { try { await apiRequest<void>("/auth/verify", { method: "POST", body: { code } }); return { ok: true }; } catch (error) { if (!(error instanceof CustomerApiError)) return { ok: false, reason: "incorrect" }; const codeName = error.code; return { ok: false, reason: codeName === "OTP_EXPIRED" ? "expired" : codeName === "OTP_ATTEMPTS_EXCEEDED" ? "attempts" : "incorrect" }; } },
  async resendVerification() { await apiRequest<void>("/auth/verify/resend", { method: "POST" }); return { ok: true }; },
  async resetPassword(password) { await apiRequest<void>("/auth/password/reset", { method: "POST", body: { password } }); return { ok: true }; },
  async verifyCurrentPassword(password) { try { await apiRequest<void>("/auth/password/verify", { method: "POST", body: { password } }); return { ok: true }; } catch { return { ok: false }; } },
  async changePassword(currentPassword, nextPassword) { try { await apiRequest<void>("/auth/password/change", { method: "POST", body: { currentPassword, nextPassword } }); return { ok: true }; } catch (error) { return { ok: false, reason: error instanceof CustomerApiError && error.code === "CURRENT_PASSWORD_INVALID" ? "current" : "new" }; } },
  async logout() { await apiRequest<void>("/auth/logout", { method: "POST" }); },
  async updateProfile(input) { return apiRequest<AuthUser>("/profile", { method: "PATCH", body: input }); },
  async deleteAccount() { await apiRequest<void>("/profile", { method: "DELETE" }); return { ok: true }; },
};

export const authGateway = portalDataMode === "http" ? httpAuthGateway : mockAuthGateway;
