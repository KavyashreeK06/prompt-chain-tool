"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Flavor, Step } from "./MainApp";

const supabase = createClient();

interface Props {
  flavor: Flavor;
  steps: Step[];
  onReloadSteps: () => void;
  onReloadFlavors: () => void;
  notify: (msg: string, ok?: boolean) => void;
}

export default function FlavorEditor({ flavor, steps, onReloadSteps, onReloadFlavors, notify }: Props) {
  const [editingFlavor, setEditingFlavor] = useState(false);
  const [flavorName, setFlavorName] = useState(flavor.name);
  const [flavorDesc, setFlavorDesc] = useState(flavor.description ?? "");
  const [showDeleteFlavor, setShowDeleteFlavor] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState("");
  const [showAddStep, setShowAddStep] = useState(false);
  const [newInstruction, setNewInstruction] = useState("");
  const [saving, setSaving] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);
  const [deleteStepId, setDeleteStepId] = useState<string | null>(null);

  const inp = { background: "var(--surface2)", border: "1.5px solid var(--border)", color: "var(--text)", borderRadius: 8, padding: "10px 14px", fontSize: 14, width: "100%", outline: "none", fontFamily: "'Syne', sans-serif" } as const;
  const btnP = { padding: "10px 20px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, letterSpacing: "0.03em", transition: "opacity 0.15s", cursor: "pointer" } as const;
  const btnS = { padding: "8px 16px", background: "transparent", color: "var(--text-muted)", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 12, transition: "all 0.15s", cursor: "pointer" } as const;

  const saveFlavor = async () => {
    setSaving(true);
    const { error } = await supabase.from("humor_flavors").update({ name: flavorName.trim(), description: flavorDesc.trim() || null }).eq("id", flavor.id);
    setSaving(false);
    if (error) return notify(error.message, false);
    notify("Flavor updated!"); setEditingFlavor(false); onReloadFlavors();
  };

  const deleteFlavor = async () => {
    await supabase.from("humor_flavor_steps").delete().eq("humor_flavor_id", flavor.id);
    const { error } = await supabase.from("humor_flavors").delete().eq("id", flavor.id);
    if (error) return notify(error.message, false);
    notify("Flavor deleted"); onReloadFlavors(); setShowDeleteFlavor(false);
  };

  const addStep = async () => {
    if (!newInstruction.trim()) return notify("Instruction required", false);
    setSaving(true);
    const nextNum = steps.length > 0 ? Math.max(...steps.map(s => s.step_number)) + 1 : 1;
    const { error } = await supabase.from("humor_flavor_steps").insert({ humor_flavor_id: flavor.id, step_number: nextNum, instruction: newInstruction.trim() });
    setSaving(false);
    if (error) return notify(error.message, false);
    notify("Step added!"); setNewInstruction(""); setShowAddStep(false); onReloadSteps();
  };

  const saveStep = async (id: string) => {
    setSaving(true);
    const { error } = await supabase.from("humor_flavor_steps").update({ instruction: editInstruction }).eq("id", id);
    setSaving(false);
    if (error) return notify(error.message, false);
    notify("Step saved!"); setEditingStepId(null); onReloadSteps();
  };

  const deleteStep = async (id: string) => {
    await supabase.from("humor_flavor_steps").delete().eq("id", id);
    const remaining = steps.filter(s => s.id !== id).sort((a, b) => a.step_number - b.step_number);
    for (let i = 0; i < remaining.length; i++) {
      await supabase.from("humor_flavor_steps").update({ step_number: i + 1 }).eq("id", remaining[i].id);
    }
    notify("Step deleted"); setDeleteStepId(null); onReloadSteps();
  };

  const moveStep = async (id: string, dir: "up" | "down") => {
    const sorted = [...steps].sort((a, b) => a.step_number - b.step_number);
    const idx = sorted.findIndex(s => s.id === id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    setMoving(id);
    const a = sorted[idx], b = sorted[swapIdx];
    await supabase.from("humor_flavor_steps").update({ step_number: b.step_number }).eq("id", a.id);
    await supabase.from("humor_flavor_steps").update({ step_number: a.step_number }).eq("id", b.id);
    setMoving(null);
    onReloadSteps();
  };

  const sorted = [...steps].sort((a, b) => a.step_number - b.step_number);

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      {showDeleteFlavor && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, padding: 40, width: 380, textAlign: "center", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, marginBottom: 12, color: "var(--text)" }}>Delete flavor?</div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-muted)", marginBottom: 28 }}>This will delete the flavor and all its steps. Cannot be undone.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setShowDeleteFlavor(false)} style={btnS}>Cancel</button>
              <button onClick={deleteFlavor} style={{ ...btnP, background: "#dc2626" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {deleteStepId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, padding: 40, width: 360, textAlign: "center", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, marginBottom: 12, color: "var(--text)" }}>Delete step?</div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-muted)", marginBottom: 28 }}>Remaining steps will be renumbered.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setDeleteStepId(null)} style={btnS}>Cancel</button>
              <button onClick={() => deleteStep(deleteStepId)} style={{ ...btnP, background: "#dc2626" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Flavor meta */}
      <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: "var(--shadow)" }}>
        {!editingFlavor ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Flavor Settings</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: "var(--text)" }}>{flavor.name}</div>
              {flavor.description && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{flavor.description}</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setFlavorName(flavor.name); setFlavorDesc(flavor.description ?? ""); setEditingFlavor(true); }} style={btnS}>Edit</button>
              <button onClick={() => setShowDeleteFlavor(true)} style={{ ...btnS, borderColor: "#fca5a5", color: "#dc2626" }}>Delete</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Edit Flavor</div>
            <input style={inp} value={flavorName} onChange={e => setFlavorName(e.target.value)} placeholder="Flavor name *" />
            <input style={inp} value={flavorDesc} onChange={e => setFlavorDesc(e.target.value)} placeholder="Description (optional)" />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setEditingFlavor(false)} style={btnS}>Cancel</button>
              <button onClick={saveFlavor} disabled={saving} style={btnP}>{saving ? "Saving..." : "Save Flavor"}</button>
            </div>
          </div>
        )}
      </div>

      {/* Steps */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: "var(--text)" }}>Prompt Steps</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sorted.length} step{sorted.length !== 1 ? "s" : ""} · run in order</div>
        </div>
        <button onClick={() => setShowAddStep(true)} style={btnP}>+ Add Step</button>
      </div>

      {showAddStep && (
        <div style={{ background: "var(--surface)", border: "1.5px solid var(--accent)", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "var(--shadow)" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--accent)", letterSpacing: "0.1em", marginBottom: 10 }}>NEW STEP {sorted.length + 1}</div>
          <textarea style={{ ...inp, minHeight: 100, resize: "vertical" as const, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }} placeholder="Describe what this step should do." value={newInstruction} onChange={e => setNewInstruction(e.target.value)} autoFocus />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
            <button onClick={() => { setShowAddStep(false); setNewInstruction(""); }} style={btnS}>Cancel</button>
            <button onClick={addStep} disabled={saving} style={btnP}>{saving ? "Adding..." : "Add Step"}</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sorted.map((step, idx) => (
          <div key={step.id} style={{ background: "var(--surface)", border: `1.5px solid ${editingStepId === step.id ? "var(--accent)" : "var(--border)"}`, borderRadius: 12, padding: 20, boxShadow: "var(--shadow)", opacity: moving === step.id ? 0.5 : 1, transition: "all 0.15s" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600 }}>{step.step_number}</div>
                <button onClick={() => moveStep(step.id, "up")} disabled={idx === 0 || !!moving} style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 6px", color: "var(--text-dim)", fontSize: 10, cursor: "pointer" }}>↑</button>
                <button onClick={() => moveStep(step.id, "down")} disabled={idx === sorted.length - 1 || !!moving} style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 6px", color: "var(--text-dim)", fontSize: 10, cursor: "pointer" }}>↓</button>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingStepId === step.id ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <textarea style={{ ...inp, minHeight: 90, resize: "vertical" as const, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }} value={editInstruction} onChange={e => setEditInstruction(e.target.value)} autoFocus />
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button onClick={() => setEditingStepId(null)} style={btnS}>Cancel</button>
                      <button onClick={() => saveStep(step.id)} disabled={saving} style={btnP}>{saving ? "Saving..." : "Save"}</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginBottom: 12 }}>{step.instruction}</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setEditingStepId(step.id); setEditInstruction(step.instruction); }} style={{ ...btnS, padding: "6px 14px", fontSize: 11 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>Edit</button>
                      <button onClick={() => setDeleteStepId(step.id)} style={{ ...btnS, padding: "6px 14px", fontSize: 11 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.color = "#dc2626"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {sorted.length === 0 && !showAddStep && (
          <div style={{ padding: "48px 24px", textAlign: "center", border: "1.5px dashed var(--border)", borderRadius: 12, background: "var(--surface)" }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontStyle: "italic", color: "var(--text-dim)", marginBottom: 8 }}>No steps yet</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-dim)" }}>Add a step to define how this flavor generates captions</div>
          </div>
        )}
      </div>
    </div>
  );
}
