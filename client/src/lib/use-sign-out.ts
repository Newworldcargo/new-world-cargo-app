import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { feedback } from "@/lib/feedback";

export function useSignOut() {
  const { logout } = useAuth();
  const [, navigate] = useLocation();
  const pending = useRef(false);
  const [signingOut, setSigningOut] = useState(false);
  const signOut = async () => {
    if (pending.current) return;
    pending.current = true;
    setSigningOut(true);
    try {
      await logout();
      navigate("/login");
      feedback.success("Signed out successfully.");
    } catch {
      feedback.error("We couldn't sign you out. Please try again.");
    } finally {
      pending.current = false;
      setSigningOut(false);
    }
  };
  return { signOut, signingOut };
}
