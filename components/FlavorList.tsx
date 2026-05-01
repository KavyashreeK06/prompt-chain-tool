"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Flavor } from "./MainApp";

const supabase = createClient();

interface Props {
  flavors: Flavor[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReload: () => void;
  notify: (msg: string, ok?: boolean) => void;
}

export default function FlavorList({ flavors, selectedId, onSelect, onReload, notify }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!name.trim()) return notify("Name required", false);
    setSaving(true);
    const { error } = await supabase.from("humor_flavors").insert({ name: name.trim(), description: desc.trim() || null });
    setSaving(false);
    if (error) return notify(error.message, false);
    notify("Flavor created!");
    setName(""); setDesc(""); setShowCreate(false);
    onReload();
  };

  const inp = { background: "var(--surface2)", border: "1.5px solid var(--border)", color: "var(--text)", borderRadius: 8, padding: "9px 12px", fontSize: 13, width: "100%", outline: "none", fontFamily: "'Syne', sans-serif" } as const;

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "12px 0" }}>
      {/* New flavor btn */}
      {!showCreate ? (
        <div style={{ padding: "0 12px 8px" }}>
          <button onClick={() => setShowCreate(true)} style={{ width: "100%", padding: "9px", background: "var(--accent-light)", border: "1.5px dashed rgba(212,56,13,0.3)", borderRadius: 8, color: "var(--accent)", fontSize: 11, letterSpacing: "0.05em", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,56,13,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--accent-light)"; }}>
            + New Flavor
          </button>
        </div>
      ) : (
        <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <input style={inp} placeholder="Flavor name *" value={name} onChange={e => setName(e.target.value)} autoFocus onKeyDown={e => e.key === "Enter" && create()} />
          <input style={inp} placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} />
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => { setShowCreate(false); setName(""); setDesc(""); }} style={{ flex: 1, padding: "8px", background: "transparent", border: "1.5px solid var(--border)", color: "var(--text-muted)", borderRadius: 6, fontSize: 11 }}>Cancel</button>
            <button onClick={create} disabled={saving} style={{ flex: 1, padding: "8px", background: "var(--accent)", border: "none", color: "#fff", borderRadius: 6, fontSize: 11 }}>{saving ? "..." : "Create"}</button>
          </div>
        </div>
      )}

      {/* List */}
      {flavors.map(f => (
        <button key={f.id} onClick={() => onSelect(f.id)} style={{ width: "100%", padding: "12px 20px", background: selectedId === f.id ? "var(--accent-light)" : "transparent", borderLeft: selectedId === f.id ? "3px solid var(--accent)" : "3px solid transparent", color: selectedId === f.id ? "var(--accent)" : "var(--text)", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, transition: "all 0.12s", textAlign: "left" }}
          onMouseEnter={e => { if (f.id !== selectedId) e.currentTarget.style.background = "var(--surface2)"; }}
          onMouseLeave={e => { if (f.id !== selectedId) e.currentTarget.style.background = "transparent"; }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{f.name}</div>
          {f.description && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{f.description}</div>}
        </button>
      ))}

      {flavors.length === 0 && (
        <div style={{ padding: "32px 20px", textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-dim)" }}>No flavors yet</div>
      )}
    </div>
  );
}
