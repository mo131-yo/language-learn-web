"use client";

import { FormEvent, useEffect, useState } from "react";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string;
};

type AuthModalProps = {
  onAuth: (user: AuthUser) => void;
};

type AuthMode = "login" | "register";

export function AuthModal({ onAuth }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(() => {
      setToast("");
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setToast("");
    setBusy(true);
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (!normalizedEmail) {
        throw new Error("Email оруулна уу");
      }

      if (!password) {
        throw new Error("Нууц үг оруулна уу");
      }

      if (mode === "register" && trimmedName.length < 2) {
        throw new Error("Нэр дор хаяж 2 тэмдэгт байна");
      }

      if (mode === "register" && password.length < 8) {
        throw new Error("Нууц үг дор хаяж 8 тэмдэгт байна");
      }

      const url = mode === "register" ? "/api/auth/register" : "/api/auth/login";

      const body =
        mode === "register"
          ? { name: trimmedName, email: normalizedEmail, password }
          : { email: normalizedEmail, password };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (mode === "login" && data?.code === "USER_NOT_FOUND") {
          setMode("register");
          setShowPassword(false);
          setError("");
          setToast("Та эхлээд бүртгүүлнэ үү.");
          return;
        }

        throw new Error(data?.error ?? "Алдаа гарлаа");
      }

      onAuth({
        id: data.id,
        name: data.name,
        email: data.email,
        avatar: data.avatar ?? null,
        bio: data.bio ?? "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setBusy(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setToast("");
    setShowPassword(false);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: 'Nunito', 'Segoe UI', sans-serif;
          background: #f5f5f0;
        }

        .auth-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background:
            radial-gradient(circle at top left, rgba(34,197,94,0.18), transparent 32%),
            radial-gradient(circle at bottom right, rgba(245,158,11,0.18), transparent 28%),
            #f5f5f0;
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 24px 70px rgba(15,23,42,0.12);
        }

        .auth-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 30px;
          font-weight: 900;
          color: #16a34a;
          letter-spacing: -1px;
          margin-bottom: 8px;
        }

        .auth-logo span {
          color: #111827;
        }

        .auth-title {
          text-align: center;
          font-size: 24px;
          font-weight: 900;
          color: #111827;
          margin-bottom: 6px;
        }

        .auth-subtitle {
          text-align: center;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.5;
          color: #6b7280;
          margin-bottom: 22px;
        }

        .auth-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          background: #f3f4f6;
          padding: 5px;
          border-radius: 16px;
          margin-bottom: 22px;
        }

        .auth-tab {
          border: none;
          border-radius: 12px;
          padding: 11px 10px;
          background: transparent;
          color: #6b7280;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s, color 0.15s, box-shadow 0.15s;
        }

        .auth-tab.active {
          background: #ffffff;
          color: #111827;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .auth-label {
          font-size: 12px;
          font-weight: 900;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .auth-input {
          width: 100%;
          border: 2px solid #e5e7eb;
          border-radius: 14px;
          padding: 14px 15px;
          font-size: 15px;
          font-weight: 700;
          color: #111827;
          outline: none;
          font-family: inherit;
          background: #ffffff;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .auth-input:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 4px rgba(22,163,74,0.12);
        }

        .auth-input::placeholder {
          color: #c4c9d2;
          font-weight: 600;
        }

        .password-wrap {
          position: relative;
          width: 100%;
        }

        .password-wrap .auth-input {
          padding-right: 56px;
        }

        .password-icon-button {
          position: absolute;
          top: 0;
          right: 8px;
          bottom: 0;
          margin: auto 0;
          width: 40px;
          height: 40px;
          min-width: 40px;
          min-height: 40px;
          border: none;
          background: transparent;
          color: #6b7280;
          border-radius: 999px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          line-height: 1;
          appearance: none;
          -webkit-appearance: none;
          transform: none;
          translate: none;
          flex-shrink: 0;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .password-icon-button:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .password-icon-button:focus-visible {
          outline: none;
          background: #ecfdf5;
          color: #166534;
        }

        .password-icon-button:active {
          background: #e5e7eb;
          color: #111827;
        }

        .password-icon-button svg {
          display: block;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          stroke: currentColor;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .auth-error {
          background: #fef2f2;
          border: 2px solid #fecaca;
          color: #dc2626;
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.4;
        }

        .auth-toast {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 0 18px;
          padding: 13px 16px;
          border-radius: 18px;
          background: #fff7ed;
          border: 2px solid #fdba74;
          color: #9a3412;
          font-size: 14px;
          font-weight: 900;
          line-height: 1.3;
          text-align: center;
          box-shadow: 0 10px 24px rgba(249, 115, 22, 0.14);
          animation: authToastIn 0.22s ease;
        }

        @keyframes authToastIn {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .auth-button {
          width: 100%;
          border: none;
          border-radius: 16px;
          padding: 15px 18px;
          background: #16a34a;
          color: #ffffff;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 5px 0 #15803d;
          transition: transform 0.1s, box-shadow 0.1s, background 0.15s;
          margin-top: 4px;
        }

        .auth-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 0 #15803d;
        }

        .auth-button:active {
          transform: translateY(4px);
          box-shadow: 0 1px 0 #15803d;
        }

        .auth-button:disabled {
          background: #d1d5db;
          box-shadow: 0 5px 0 #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .auth-note {
          margin-top: 18px;
          text-align: center;
          color: #6b7280;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.5;
        }

        .auth-switch {
          border: none;
          background: none;
          color: #16a34a;
          font-weight: 900;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
        }

        .auth-security {
          margin-top: 18px;
          padding: 13px 14px;
          border-radius: 16px;
          background: #f0fdf4;
          border: 2px solid #bbf7d0;
          color: #166534;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.45;
        }
      `}</style>

      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-logo">
            Linguist<span>.</span>
          </div>

          <div className="auth-title">
            {mode === "login" ? "Нэвтрэх" : "Бүртгүүлэх"}
          </div>

          <div className="auth-subtitle">
            {mode === "login"
              ? "Email болон нууц үгээ ашиглан үргэлжлүүлнэ үү."
              : "Шинэ хэрэглэгч үүсгээд үгийн сангаа хадгалаарай."}
          </div>

          {toast && (
            <div className="auth-toast" role="status" aria-live="polite">
              {toast}
            </div>
          )}

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab${mode === "login" ? " active" : ""}`}
              onClick={() => switchMode("login")}
            >
              Нэвтрэх
            </button>

            <button
              type="button"
              className={`auth-tab${mode === "register" ? " active" : ""}`}
              onClick={() => switchMode("register")}
            >
              Бүртгүүлэх
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="auth-field">
                <label className="auth-label">Нэр</label>
                <input
                  name="name"
                  className="auth-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Таны нэр"
                  autoComplete="name"
                  minLength={2}
                  required
                />
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                name="email"
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Нууц үг</label>

              <div className="password-wrap">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "register"
                      ? "Дор хаяж 8 тэмдэгт"
                      : "Нууц үгээ оруулна уу"
                  }
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  minLength={mode === "register" ? 8 : 1}
                  required
                />

                <button
                  type="button"
                  className="password-icon-button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харах"}
                  title={showPassword ? "Нууц үг нуух" : "Нууц үг харах"}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12c.8-2.27 2.22-4.2 4.06-5.54" />
                      <path d="M9.9 4.24A10.82 10.82 0 0 1 12 4c5 0 9.27 3.11 11 8a11.5 11.5 0 0 1-2.16 3.43" />
                      <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-button" disabled={busy}>
              {busy
                ? mode === "login"
                  ? "Нэвтэрч байна..."
                  : "Бүртгэж байна..."
                : mode === "login"
                ? "Нэвтрэх"
                : "Бүртгүүлэх"}
            </button>
          </form>

          <div className="auth-note">
            {mode === "login" ? (
              <>
                Бүртгэлгүй юу?{" "}
                <button
                  type="button"
                  className="auth-switch"
                  onClick={() => switchMode("register")}
                >
                  Шинээр бүртгүүлэх
                </button>
              </>
            ) : (
              <>
                Аль хэдийн бүртгэлтэй юу?{" "}
                <button
                  type="button"
                  className="auth-switch"
                  onClick={() => switchMode("login")}
                >
                  Нэвтрэх
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
