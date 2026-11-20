"use client";

import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="auth-page">
      <div className="auth-card surface">
        <div className="auth-brand">
          <Image src="/logo-mark.svg" alt="" width={40} height={40} />
          <div>
            <span className="brand-name">CertiBuy</span>
            <span className="brand-tagline">Buy Smart. Sell Better. Trust Every Device.</span>
          </div>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your CertiBuy account.</p>

        <form onSubmit={handleLogin} noValidate>
          <div className="form-group">
            <label className="field-label" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="amit@example.com"
              className="form-input"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="field-label" htmlFor="login-pw">Password</label>
            <div className="pw-wrapper">
              <input
                id="login-pw"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="form-input pw-input"
                autoComplete="current-password"
                required
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? (
              <>
                <span className="spinner" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account? <Link href="/register" className="auth-link">Create one</Link>
        </p>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 1rem;
          background: hsl(var(--background));
        }
        .auth-card {
          width: 100%;
          max-width: 440px;
          padding: 2.5rem 2rem;
        }
        .auth-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }
        .brand-name {
          display: block;
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.25rem;
          color: hsl(var(--foreground));
          letter-spacing: -0.02em;
        }
        .brand-tagline {
          display: block;
          font-size: 0.6875rem;
          color: hsl(var(--muted));
        }
        .auth-title {
          font-size: 1.375rem;
          font-weight: 700;
          color: hsl(var(--foreground));
          margin: 0 0 0.25rem;
        }
        .auth-subtitle {
          font-size: 0.875rem;
          color: hsl(var(--muted));
          margin: 0 0 1.5rem;
          line-height: 1.5;
        }
        .form-group {
          margin-bottom: 1.125rem;
        }
        .form-input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid hsl(var(--input));
          border-radius: 0.75rem;
          font-size: 0.875rem;
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          box-sizing: border-box;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .form-input::placeholder {
          color: hsl(var(--muted));
          opacity: 0.6;
        }
        .form-input:focus {
          outline: none;
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 3px hsl(var(--ring) / 0.1);
        }
        .pw-wrapper { position: relative; }
        .pw-input { padding-right: 2.75rem; }
        .pw-toggle {
          position: absolute;
          right: 0.625rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: hsl(var(--muted));
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .pw-toggle:hover { color: hsl(var(--foreground)); }
        .alert-error {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background: hsl(var(--destructive) / 0.06);
          border: 1px solid hsl(var(--destructive) / 0.2);
          color: hsl(var(--destructive));
          font-size: 0.8125rem;
          margin-bottom: 1rem;
          line-height: 1.4;
        }
        .alert-error svg { flex-shrink: 0; margin-top: 0.0625rem; }
        .submit-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border: none;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .submit-btn:hover:not(:disabled) { opacity: 0.9; }
        .submit-btn:disabled { opacity: 0.6; cursor: default; }
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid hsl(var(--primary-foreground) / 0.3);
          border-top-color: hsl(var(--primary-foreground));
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-footer {
          text-align: center;
          font-size: 0.8125rem;
          color: hsl(var(--muted));
          margin: 1.5rem 0 0;
        }
        @media (max-width: 480px) {
          .auth-card { padding: 1.75rem 1.25rem; }
        }
      `}</style>
    </main>
  );
}
