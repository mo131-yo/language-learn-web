"use client";
import { useState } from "react";

type Props = { onAuth: (name: string) => void };

export function AuthModal({ onAuth }: Props) {
  const [mode, setMode] = useState<"login"|"signup">("login");
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    if (!name.trim() || !pw.trim()) { setError("Бүх талбарыг бөглөнө үү"); return; }
    if (mode === "signup" && pw !== pw2) { setError("Нууц үг таарахгүй байна"); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), password: pw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Алдаа гарлаа");
      onAuth(data.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Алдаа гарлаа");
    } finally { setBusy(false); }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"var(--bg-secondary)", borderRadius:24, padding:32, width:"100%", maxWidth:380, border:"2px solid var(--border)" }}>
        <div style={{ fontSize:22, fontWeight:900, color:"var(--primary)", marginBottom:20 }}>Linguist<span style={{color:"var(--text)"}}>.</span></div>

        {/* Tabs */}
        <div style={{ display:"flex", background:"var(--muted)", borderRadius:10, padding:3, gap:3, marginBottom:20 }}>
          {(["login","signup"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              style={{ flex:1, padding:"9px 8px", borderRadius:8, border:"none",
                background: mode===m ? "var(--bg-secondary)" : "transparent",
                color: mode===m ? "var(--text)" : "var(--text-secondary)",
                fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
              {m === "login" ? "Нэвтрэх" : "Бүртгүүлэх"}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <input className="form-input" placeholder="Нэр..." value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} />
          <input className="form-input" type="password" placeholder="Нууц үг..." value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} />
          {mode === "signup" && (
            <input className="form-input" type="password" placeholder="Нууц үг давтах..." value={pw2} onChange={e=>setPw2(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} />
          )}
          {error && (
            <div style={{ background:"var(--error-soft)", border:"2px solid var(--error-soft-border)", borderRadius:12, padding:"10px 14px", fontSize:13, color:"var(--error)", fontWeight:700 }}>
              {error}
            </div>
          )}
          <button className="submit-btn" onClick={submit} disabled={busy} style={{marginTop:0}}>
            {busy ? "Уншиж байна..." : mode === "login" ? "Нэвтрэх" : "Бүртгүүлэх"}
          </button>
        </div>
      </div>
    </div>
  );
}