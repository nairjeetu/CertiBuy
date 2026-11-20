"use client";

import { createClient } from "@/lib/supabase-browser";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{10,15}$/;

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "var(--destructive)" };
  if (score <= 2) return { score, label: "Fair", color: "var(--warning)" };
  if (score <= 3) return { score, label: "Good", color: "var(--success)" };
  return { score, label: "Strong", color: "var(--success)" };
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Full name is required.";
    if (!email.trim()) errs.email = "Email is required.";
    else if (!EMAIL_RE.test(email)) errs.email = "Enter a valid email address.";
    if (!phone.trim()) errs.phone = "Mobile number is required.";
    else if (!PHONE_RE.test(phone.replace(/[\s-]/g, ""))) errs.phone = "Enter a valid mobile number (10–15 digits).";
    if (!password) errs.password = "Password is required.";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (!confirmPassword) errs.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.replace(/[\s-]/g, ""),
        },
      },
    });

    if (signUpError) {
      const msg = signUpError.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already been registered")) {
        setError("An account with this email already exists. Please sign in instead.");
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  const strength = passwordStrength(password);

  if (success) {
    return (
      <main className="auth-page">
        <div className="auth-card surface">
          <div className="auth-brand">
            <Image src="/logo-mark.svg" alt="" width={40} height={40} />
            <span className="brand-name">CertiBuy</span>
          </div>
          <div className="success-block">
            <div className="success-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--success))" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
            </p>
            <Link href="/login" className="btn-primary" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: "1.5rem" }}>
              Go to sign in
            </Link>
          </div>
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
            font-family: var(--font-heading);
            font-weight: 700;
            font-size: 1.25rem;
            color: hsl(var(--foreground));
          }
          .success-block { text-align: center; }
          .success-icon { margin-bottom: 1rem; }
          .auth-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: hsl(var(--foreground));
            margin: 0 0 0.5rem;
          }
          .auth-subtitle {
            font-size: 0.875rem;
            color: hsl(var(--muted));
            line-height: 1.5;
            margin: 0;
          }
        `}</style>
      </main>
    );
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

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">One account to buy and sell certified devices.</p>

        <form onSubmit={handleRegister} noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label className="field-label" htmlFor="reg-name">Full name</label>
            <input
              id="reg-name"
              type="text"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setFieldErrors((p) => ({ ...p, fullName: "" })); }}
              placeholder="Amit Patel"
              className={`form-input ${fieldErrors.fullName ? "input-error" : ""}`}
              autoComplete="name"
            />
            {fieldErrors.fullName && <span className="inline-error">{fieldErrors.fullName}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="field-label" htmlFor="reg-email">Email address</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
              placeholder="amit@example.com"
              className={`form-input ${fieldErrors.email ? "input-error" : ""}`}
              autoComplete="email"
            />
            {fieldErrors.email && <span className="inline-error">{fieldErrors.email}</span>}
          </div>

          {/* Phone */}
          <div className="form-group">
            <label className="field-label" htmlFor="reg-phone">Mobile number</label>
            <div className="phone-wrapper">
              <span className="phone-prefix">+91</span>
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setFieldErrors((p) => ({ ...p, phone: "" })); }}
                placeholder="98765 43210"
                className={`form-input phone-input ${fieldErrors.phone ? "input-error" : ""}`}
                autoComplete="tel"
              />
            </div>
            {fieldErrors.phone && <span className="inline-error">{fieldErrors.phone}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="field-label" htmlFor="reg-pw">Password</label>
            <div className="pw-wrapper">
              <input
                id="reg-pw"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
                placeholder="Min. 8 characters"
                className={`form-input pw-input ${fieldErrors.password ? "input-error" : ""}`}
                autoComplete="new-password"
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            {password && (
              <div className="strength-row">
                <div className="strength-bar">
                  <div className="strength-fill" style={{ width: `${(strength.score / 5) * 100}%`, background: `hsl(${strength.color})` }} />
                </div>
                <span className="strength-label" style={{ color: `hsl(${strength.color})` }}>{strength.label}</span>
              </div>
            )}
            {fieldErrors.password && <span className="inline-error">{fieldErrors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="field-label" htmlFor="reg-cpw">Confirm password</label>
            <div className="pw-wrapper">
              <input
                id="reg-cpw"
                type={showConfirmPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: "" })); }}
                placeholder="Re-enter your password"
                className={`form-input pw-input ${fieldErrors.confirmPassword ? "input-error" : ""}`}
                autoComplete="new-password"
              />
              <button type="button" className="pw-toggle" onClick={() => setShowConfirmPw(!showConfirmPw)} aria-label={showConfirmPw ? "Hide password" : "Show password"}>
                {showConfirmPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            {confirmPassword && password === confirmPassword && (
              <span className="match-ok">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--success))" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Passwords match
              </span>
            )}
            {fieldErrors.confirmPassword && <span className="inline-error">{fieldErrors.confirmPassword}</span>}
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
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link href="/login" className="auth-link">Sign in</Link>
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

        /* Brand */
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

        /* Title */
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

        /* Form */
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
        .input-error {
          border-color: hsl(var(--destructive));
        }
        .input-error:focus {
          box-shadow: 0 0 0 3px hsl(var(--destructive) / 0.1);
        }

        /* Phone */
        .phone-wrapper {
          display: flex;
          align-items: center;
        }
        .phone-prefix {
          padding: 0.625rem 0.75rem;
          border: 1px solid hsl(var(--input));
          border-right: none;
          border-radius: 0.75rem 0 0 0.75rem;
          background: hsl(var(--secondary));
          font-size: 0.875rem;
          color: hsl(var(--muted));
          flex-shrink: 0;
        }
        .phone-input {
          border-radius: 0 0.75rem 0.75rem 0;
        }

        /* Password */
        .pw-wrapper {
          position: relative;
        }
        .pw-input {
          padding-right: 2.75rem;
        }
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

        /* Strength bar */
        .strength-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.375rem;
        }
        .strength-bar {
          flex: 1;
          height: 4px;
          background: hsl(var(--border));
          border-radius: 2px;
          overflow: hidden;
        }
        .strength-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s, background 0.3s;
        }
        .strength-label {
          font-size: 0.6875rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        /* Match indicator */
        .match-ok {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: hsl(var(--success));
          font-weight: 500;
        }

        /* Inline errors */
        .inline-error {
          display: block;
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: hsl(var(--destructive));
        }

        /* Alert */
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

        /* Submit */
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
          margin-top: 0.25rem;
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

        /* Footer */
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
