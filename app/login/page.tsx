"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginContent() {
  const params = useSearchParams();
  const error = params.get("error");

  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      {/* decorative circles */}
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,56,13,0.06) 0%, transparent 70%)", top: "-10%", right: "-10%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)", bottom: "0", left: "-5%", pointerEvents: "none" }} />

      <div style={{ position: "relative", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 20, padding: "56px 48px", width: 420, boxShadow: "var(--shadow-lg)", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--accent-light)", border: "1px solid rgba(212,56,13,0.2)", borderRadius: 100, padding: "4px 14px", marginBottom: 32 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em" }}>FLAVOR STUDIO</span>
        </div>

        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 600, lineHeight: 1.1, color: "var(--text)", marginBottom: 12 }}>
          Craft the<br /><em>perfect laugh</em>
        </h1>

        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-muted)", marginBottom: 40, lineHeight: 1.6 }}>
          Prompt chain tool for humor flavor engineers
        </p>

        {error === "unauthorized" && (
          <div style={{ background: "rgba(212,56,13,0.08)", border: "1px solid rgba(212,56,13,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 24, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--accent)", textAlign: "left" }}>
            ⚠ Access denied. Superadmin or matrix admin required.
          </div>
        )}

        <button
          onClick={handleLogin}
          style={{ width: "100%", padding: "14px 24px", background: "var(--text)", color: "var(--bg)", borderRadius: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, letterSpacing: "0.02em", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "opacity 0.2s, transform 0.1s" }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          onMouseDown={e => { e.currentTarget.style.transform = "scale(0.99)"; }}
          onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ marginTop: 32, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.1em" }}>
          ALMOSTCRACKD · INTERNAL TOOL
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginContent /></Suspense>;
}
