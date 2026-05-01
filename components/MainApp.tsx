"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "./ThemeToggle";
import FlavorList from "./FlavorList";
import FlavorEditor from "./FlavorEditor";
import TestPanel from "./TestPanel";

const supabase = createClient();

export interface Flavor {
  id: string;
  slug: string;
  description: string | null;

  created_datetime_utc: string;
}

export interface Step {
  id: string;
  humor_flavor_id: string;
  step_number: number;
  instruction: string;
  created_datetime_utc: string;
}

interface Props {
  profile: { first_name?: string; last_name?: string; email?: string };
  initialFlavors: Flavor[];
  testImages: { id: string; url: string; image_description: string | null }[];
}

export default function MainApp({ profile, initialFlavors, testImages }: Props) {
  const [flavors, setFlavors] = useState<Flavor[]>(initialFlavors);
  const [selectedId, setSelectedId] = useState<string | null>(initialFlavors[0]?.id ?? null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [view, setView] = useState<"editor" | "test">("editor");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadSteps = useCallback(async (flavorId: string) => {
    const { data } = await supabase
      .from("humor_flavor_steps")
      .select("*")
      .eq("humor_flavor_id", flavorId)
      .order("step_number");
    setSteps(data ?? []);
  }, []);

  useEffect(() => {
    if (selectedId) loadSteps(selectedId);
  }, [selectedId, loadSteps]);

  const reloadFlavors = async () => {
    const { data } = await supabase.from("humor_flavors").select("*").order("created_datetime_utc", { ascending: false });
    setFlavors(data ?? []);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const selectedFlavor = flavors.find(f => f.id === selectedId) ?? null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.ok ? "var(--accent3)" : "var(--accent)", color: "#fff", padding: "10px 20px", borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, boxShadow: "var(--shadow-lg)", animation: "slideIn 0.2s ease" }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: 280, background: "var(--surface)", borderRight: "1.5px solid var(--border)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 }}>
        {/* Header */}
        <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Flavor Studio</div>
            <ThemeToggle />
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>Humor Flavors</div>
        </div>

        {/* Flavor list */}
        <FlavorList
          flavors={flavors}
          selectedId={selectedId}
          onSelect={id => { setSelectedId(id); setView("editor"); }}
          onReload={reloadFlavors}
          notify={notify}
        />

        {/* User */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", marginTop: "auto" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-muted)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {profile?.first_name} {profile?.last_name}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-dim)", marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {profile?.email}
          </div>
          <button onClick={handleSignOut} style={{ width: "100%", padding: "7px", background: "transparent", border: "1.5px solid var(--border)", color: "var(--text-muted)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: 6, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 280, flex: 1, display: "flex", flexDirection: "column" }}>
        {selectedFlavor ? (
          <>
            {/* Top bar */}
            <div style={{ background: "var(--surface)", borderBottom: "1.5px solid var(--border)", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
              <div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: "var(--text)" }}>{selectedFlavor.slug}</div>
                {selectedFlavor.description && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{selectedFlavor.description}</div>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {(["editor", "test"] as const).map(v => (
                  <button key={v} onClick={() => setView(v)} style={{ padding: "8px 18px", borderRadius: 8, background: view === v ? "var(--accent)" : "transparent", color: view === v ? "#fff" : "var(--text-muted)", border: `1.5px solid ${view === v ? "var(--accent)" : "var(--border)"}`, fontSize: 11, letterSpacing: "0.05em", transition: "all 0.15s", textTransform: "capitalize" }}>
                    {v === "editor" ? "⚙ Editor" : "▶ Test"}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflow: "auto" }}>
              {view === "editor" ? (
                <FlavorEditor
                  flavor={selectedFlavor}
                  steps={steps}
                  onReloadSteps={() => loadSteps(selectedFlavor.id)}
                  onReloadFlavors={reloadFlavors}
                  notify={notify}
                />
              ) : (
                <TestPanel
                  flavor={selectedFlavor}
                  steps={steps}
                  testImages={testImages}
                  notify={notify}
                />
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 300, fontStyle: "italic", color: "var(--text-dim)", marginBottom: 12 }}>No flavor selected</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-dim)" }}>Create or select a humor flavor to get started</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
