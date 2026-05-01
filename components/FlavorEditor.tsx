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
  const [flavorSlug, setFlavorSlug] = useState(flavor.slug);
  const [flavorDesc, setFlavorDesc] = useState(flavor.description ?? "");
  const [showDeleteFlavor, setShowDeleteFlavor] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editSystem, setEditSystem] = useState("");
  const [editUser, setEditUser] = useState("");
  const [showAddStep, setShowAddStep] = useState(false);
  const [newSystem, setNewSystem] = useState("");
  const [newUser, setNewUser] = useState("");
  const [saving, setSaving] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);
  const [deleteStepId, setDeleteStepId] = useState<string | null>(null);

  const inp = { background: "var(--surface2)", border: "1.5px solid var(--border)", color: "var(--text)", borderRadius: 8, padding: "10px 14px", fontSize: 13, width: "100%", outline: "none", fontFamily: "'JetBrains Mono', monospace" } as const;
  const btnP = { padding: "10px 20px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer" } as const;
  const btnS = { padding: "8px 16px", background: "transparent", color: "var(--text-muted)", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 12, cursor: "pointer" } as const;

  const saveFlavor = async () => {
    setSaving(true);
    const { error } = await supabase.from("humor_flavors").update({ slug: flavorSlug.trim(), description: flavorDesc.trim() || null }).eq("id", flavor.id);
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
    if (!newSystem.trim()) return notify("System prompt required", false);
    setSaving(true);
    const nextNum = steps.length > 0 ? Math.max(...steps.map(s => s.order_by)) + 1 : 1;
    const { error } = await supabase.from("humor_flavor_steps").insert({
      humor_flavor_id: flavor.id,
      order_by: nextNum,
      llm_system_prompt: newSystem.trim(),
      llm_user_prompt: newUser.trim() || null,
      llm_model_id: 1,
      llm_input_type_id: 1,
      llm_output_type_id: 1,
      humor_flavor_step_type_id: 1,
    });
    setSaving(false);
    if (error) return notify(error.message, false);
    notify("Step added!"); setNewSystem(""); setNewUser(""); setShowAddStep(false); onReloadSteps();
  };

  const saveStep = async (id: string) => {
    setSaving(true);
    const { error } = await supabase.from("humor_flavor_steps").update({ llm_system_prompt: editSystem, llm_user_prompt: editUser || null }).eq("id", id);
    setSaving(false);
    if (error) return notify(error.message, false);
    notify("Step saved!"); setEditingStepId(null); onReloadSteps();
  };

  const deleteStep = async (id: string) => {
    await supabase.from("humor_flavor_steps").delete().eq("id", id);
    const remaining = steps.filter(s => s.id !== id).sort((a, b) => a.order_by - b.order_by);
    for (let i = 0; i < remaining.length; i++) {
      await supabase.from("humor_flavor_steps").update({ order_by: i + 1 }).eq("id", remaining[i].id);
    }
    notify("Step deleted"); setDeleteStepId(null); onReloadSteps();
  };

  const moveStep = async (id: string, dir: "up" | "down") => {
    const sorted = [...steps].sort((a, b) => a.order_by - b.order_by);
    const idx = sorted.findIndex(s => s.id === id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    setMoving(id);
    const a = sorted[idx], b = sorted[swapIdx];
    await supabase.from("humor_flavor_steps").update({ order_by: b.order_by }).eq("id", a.id);
    await supabase.from("humor_flavor_steps").update({ order_by: a.order_by }).eq("id", b.id);
    setMoving(null);
    onReloadSteps();
  };

  const sorted = [...steps].sort((a, b) => a.order_by - b.order_by);

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      {showDeleteFlavor && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, padding: 40, width: 380, textAlign: "center" }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, marginBottom: 12, color: "var(--text)" }}>Delete flavor?</div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-muted)", marginBottom: 28 }}>Deletes the flavor and all its steps. Cannot be undone.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setShowDeleteFlavor(false)} style={btnS}>Cancel</button>
              <button onClick={deleteFlavor} style={{ ...btnP, background: "#dc2626" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {deleteStepId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, padding: 40, width: 360, textAlign: "center" }}>
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
      <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        {!editingFlavor ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Flavor Settings</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: "var(--text)" }}>{flavor.slug}</div>
              {flavor.description && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{flavor.description}</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setFlavorSlug(flavor.slug); setFlavorDesc(flavor.description ?? ""); setEditingFlavor(true); }} style={btnS}>Edit</button>
              <button onClick={() => setShowDeleteFlavor(true)} style={{ ...btnS, borderColor: "#fca5a5", color: "#dc2626" }}>Delete</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Edit Flavor</div>
            <input style={inp} value={flavorSlug} onChange={e => setFlavorSlug(e.target.value)} placeholder="Slug (e.g. dry-wit)" />
            <input style={inp} value={flavorDesc} onChange={e => setFlavorDesc(e.target.value)} placeholder="Description (optional)" />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setEditingFlavor(false)} style={btnS}>Cancel</button>
              <button onClick={saveFlavor} disabled={saving} style={btnP}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        )}
      </div>

      {/* Steps header */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: "var(--text)" }}>Prompt Steps</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sorted.length} step{sorted.length !== 1 ? "s" : ""} · run in order</div>
        </div>
        <button onClick={() => setShowAddStep(true)} style={btnP}>+ Add Step</button>
      </div>

      {/* Add step form */}
      {showAddStep && (
        <div style={{ background: "var(--surface)", border: "1.5px solid var(--accent)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--accent)", letterSpacing: "0.1em", marginBottom: 12 }}>NEW STEP {sorted.length + 1}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-muted)", marginBottom: 6 }}>SYSTEM PROMPT *</div>
              <textarea style={{ ...inp, minHeight: 90, resize: "vertical" as const }} placeholder="You are a... Describe the AI's role and behavior." value={newSystem} onChange={e => setNewSystem(e.target.value)} autoFocus />
            </div>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-muted)", marginBottom: 6 }}>USER PROMPT (optional)</div>
              <textarea style={{ ...inp, minHeight: 60, resize: "vertical" as const }} placeholder="What should the user say? Leave blank to pass previous output automatically." value={newUser} onChange={e => setNewUser(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
            <button onClick={() => { setShowAddStep(false); setNewSystem(""); setNewUser(""); }} style={btnS}>Cancel</button>
            <button onClick={addStep} disabled={saving} style={btnP}>{saving ? "Adding..." : "Add Step"}</button>
          </div>
        </div>
      )}

      {/* Step cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sorted.map((step, idx) => (
          <div key={step.id} style={{ background: "var(--surface)", border: `1.5px solid ${editingStepId === step.id ? "var(--accent)" : "var(--border)"}`, borderRadius: 12, padding: 20, opacity: moving === step.id ? 0.5 : 1, transition: "opacity 0.15s" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600 }}>{step.order_by}</div>
                <button onClick={() => moveStep(step.id, "up")} disabled={idx === 0 || !!moving} style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 6px", color: "var(--text-dim)", fontSize: 10, cursor: "pointer" }}>↑</button>
                <button onClick={() => moveStep(step.id, "down")} disabled={idx === sorted.length - 1 || !!moving} style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 6px", color: "var(--text-dim)", fontSize: 10, cursor: "pointer" }}>↓</button>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingStepId === step.id ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>SYSTEM PROMPT</div>
                      <textarea style={{ ...inp, minHeight: 80, resize: "vertical" as const }} value={editSystem} onChange={e => setEditSystem(e.target.value)} autoFocus />
                    </div>
                    <div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>USER PROMPT</div>
                      <textarea style={{ ...inp, minHeight: 60, resize: "vertical" as const }} value={editUser} onChange={e => setEditUser(e.target.value)} />
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button onClick={() => setEditingStepId(null)} style={btnS}>Cancel</button>
                      <button onClick={() => saveStep(step.id)} disabled={saving} style={btnP}>{saving ? "Saving..." : "Save"}</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>SYSTEM</div>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text)", lineHeight: 1.6, marginBottom: 10 }}>{step.llm_system_prompt}</p>
                    {step.llm_user_prompt && (
                      <>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>USER</div>
                        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text)", lineHeight: 1.6, marginBottom: 10 }}>{step.llm_user_prompt}</p>
                      </>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setEditingStepId(step.id); setEditSystem(step.llm_system_prompt); setEditUser(step.llm_user_prompt ?? ""); }} style={{ ...btnS, padding: "6px 14px", fontSize: 11 }}
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
