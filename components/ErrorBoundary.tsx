"use client";

import { Component, ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 24,
            textAlign: "center",
            background: "#f5f5f0",
            fontFamily: "'Nunito', 'Segoe UI', sans-serif",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 900, color: "#111827" }}>
            Уучлаарай, ямар нэг зүйл буруу боллоо.
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#6b7280", maxWidth: 360 }}>
            Хуудсыг дахин ачаалж үзнэ үү. Асуудал үргэлжилвэл түр хугацаанд өөр
            хэсэг рүү орж үзээрэй.
          </div>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = "/";
            }}
            style={{
              border: "none",
              borderRadius: 16,
              padding: "13px 22px",
              background: "#16a34a",
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 900,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 5px 0 #15803d",
            }}
          >
            Дахин ачаалах
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
