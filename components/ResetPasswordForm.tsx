"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Status = "idle" | "busy" | "done";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Линк буруу байна. Дахин имэйлээ шалгана уу.");
      return;
    }

    if (password.length < 8) {
      setError("Нууц үг дор хаяж 8 тэмдэгт байна");
      return;
    }

    if (password !== confirm) {
      setError("Нууц үг таарахгүй байна");
      return;
    }

    setStatus("busy");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? "Алдаа гарлаа");
      }

      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      setStatus("idle");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "#f5f5f0",
        fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          border: "2px solid #e5e7eb",
          borderRadius: 28,
          padding: 28,
          boxShadow: "0 24px 70px rgba(15,23,42,0.12)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            fontSize: 24,
            fontWeight: 900,
            color: "#111827",
            marginBottom: 6,
          }}
        >
          Шинэ нууц үг тохируулах
        </div>

        {status === "done" ? (
          <div
            style={{
              marginTop: 18,
              padding: "13px 14px",
              borderRadius: 16,
              background: "#f0fdf4",
              border: "2px solid #bbf7d0",
              color: "#166534",
              fontSize: 14,
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Нууц үг амжилттай солигдлоо. Одоо шинэ нууц үгээрээ нэвтэрч болно.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 22 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: "#374151",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Шинэ нууц үг
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Дор хаяж 8 тэмдэгт"
                minLength={8}
                required
                style={{
                  width: "100%",
                  border: "2px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "14px 15px",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#111827",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: "#374151",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Нууц үг давтах
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Дахин оруулна уу"
                minLength={8}
                required
                style={{
                  width: "100%",
                  border: "2px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "14px 15px",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#111827",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "2px solid #fecaca",
                  color: "#dc2626",
                  borderRadius: 14,
                  padding: "12px 14px",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "busy"}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 16,
                padding: "15px 18px",
                background: status === "busy" ? "#d1d5db" : "#16a34a",
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 900,
                cursor: status === "busy" ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {status === "busy" ? "Хадгалж байна..." : "Нууц үг солих"}
            </button>
          </form>
        )}

        <div style={{ marginTop: 18, textAlign: "center" }}>
          <Link
            href="/"
            style={{ color: "#16a34a", fontWeight: 900, fontSize: 13, textDecoration: "none" }}
          >
            ← Нүүр рүү буцах
          </Link>
        </div>
      </div>
    </div>
  );
}
