"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "../../lib/supabase";
import BrandLogo from "../brand";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup" | "reset" | "update">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();
    const recoveryLink = location.hash.includes("type=recovery") || location.search.includes("type=recovery");
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !recoveryLink) router.replace("/portal");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("update");
    });
    return () => listener.subscription.unsubscribe();
  }, [router]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseConfigured) return;
    setBusy(true); setMessage("");
    const values = new FormData(event.currentTarget);
    const email = String(values.get("email") ?? "").trim().toLowerCase();
    const password = String(values.get("password") ?? "");
    const fullName = String(values.get("fullName") ?? "").trim();
    const supabase = getSupabase();
    try {
      if (mode === "update") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage("Your password has been updated. You can now continue to the portal.");
        window.setTimeout(() => router.replace("/portal"), 800);
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/login/` });
        if (error) throw error;
        setMessage("Password-reset instructions have been sent if the address exists.");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
        if (error) throw error;
        if (data.session) router.replace("/portal");
        else setMessage("Account created. Check your email to confirm the address, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/portal");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The request could not be completed.");
    } finally { setBusy(false); }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <Link className="brand" href="/" aria-label="EduBonke home"><BrandLogo inverse /></Link>
        <div><p className="eyebrow-text light">South African college operations</p><h1>One account for your college workspace.</h1><p>Access admissions, teaching, assessment, POE, finance, communication and compliance workflows from any authorised device.</p></div>
        <small>R0 prototype architecture · GitHub Pages + Supabase Free</small>
      </section>
      <section className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-tabs" role="tablist">
            <button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button>
            <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button>
          </div>
          <h2>{mode === "update" ? "Choose a new password" : mode === "reset" ? "Reset your password" : mode === "signup" ? "Create your account" : "Welcome back"}</h2>
          <p>{mode === "signup" ? "Use an approved work or test email address." : mode === "update" ? "Enter a new password of at least eight characters." : "Enter your EduBonke account details."}</p>
          {!isSupabaseConfigured ? <div className="configuration-notice"><b>Backend setup required</b><p>Add the Supabase URL and anonymous key to your local `.env.local` file or GitHub repository secrets. Follow `docs/ZERO_COST_SETUP.md`.</p></div> : (
            <form onSubmit={submit} className="auth-form">
              {mode === "signup" && <label>Full name<input name="fullName" autoComplete="name" required maxLength={120} /></label>}
              {mode !== "update" && <label>Email address<input name="email" type="email" autoComplete="email" required /></label>}
              {mode !== "reset" && <label>{mode === "update" ? "New password" : "Password"}<input name="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required /></label>}
              <button className="button" disabled={busy}>{busy ? "Please wait…" : mode === "update" ? "Update password" : mode === "reset" ? "Send reset link" : mode === "signup" ? "Create account" : "Sign in"}</button>
            </form>
          )}
          {message && <p className="form-message" role="status">{message}</p>}
          {mode === "signin" ? <button className="text-button" onClick={() => setMode("reset")}>Forgot your password?</button> : mode === "reset" ? <button className="text-button" onClick={() => setMode("signin")}>Return to sign in</button> : null}
          <Link className="auth-back" href="/">← Return to EduBonke</Link>
        </div>
      </section>
    </main>
  );
}
