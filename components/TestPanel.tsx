"use client";
import { useState } from "react";
import type { Flavor, Step } from "./MainApp";

interface TestImage { id: string; url: string; image_description: string | null; }

interface Props {
  flavor: Flavor;
  steps: Step[];
  testImages: TestImage[];
  notify: (msg: string, ok?: boolean) => void;
}

interface Caption { id: string; content: string; }

export default function TestPanel({ flavor, steps, testImages, notify }: Props) {
  const [selectedImageId, setSelectedImageId] = useState<string>(testImages[0]?.id ?? "");
  const [customUrl, setCustomUrl] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [running, setRunning] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...steps].sort((a, b) => a.order_by - b.order_by);
  const selectedImage = testImages.find(i => i.id === selectedImageId);
  const imageUrl = useCustom ? customUrl : selectedImage?.url ?? "";

  const inp = { background: "var(--surface2)", border: "1.5px solid var(--border)", color: "var(--text)", borderRadius: 8, padding: "10px 14px", fontSize: 14, width: "100%", outline: "none", fontFamily: "'Syne', sans-serif" } as const;

  const runTest = async () => {
    if (!imageUrl) return notify("Select or enter an image URL", false);
    if (sorted.length === 0) return notify("Add steps to this flavor first", false);
    setRunning(true); setLog([]); setCaptions([]); setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://api.almostcrackd.ai";
      setLog(l => [...l, `▶ Starting flavor: "${flavor.slug}" with ${sorted.length} step(s)`]);
      setLog(l => [...l, `📷 Image: ${imageUrl}`]);

      const response = await fetch(`${apiUrl}/captions/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          humor_flavor_id: flavor.id,
          humor_flavor_steps: sorted.map(s => ({ step_number: s.order_by, llm_system_prompt: s.llm_system_prompt })),
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error ${response.status}: ${text}`);
      }

      const data = await response.json();
      setLog(l => [...l, `✓ API responded successfully`]);

      // Handle various response shapes
      const rawCaptions: string[] =
        data.captions ?? data.results ?? data.outputs ??
        (Array.isArray(data) ? data : null) ??
        (data.content ? [data.content] : []);

      if (rawCaptions.length > 0) {
        setCaptions(rawCaptions.map((c, i) => ({ id: String(i), content: typeof c === "string" ? c : JSON.stringify(c) })));
        setLog(l => [...l, `✓ ${rawCaptions.length} caption(s) generated`]);
      } else {
        setLog(l => [...l, `⚠ Response received but no captions found`, `Raw: ${JSON.stringify(data).slice(0, 200)}`]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setLog(l => [...l, `✗ Error: ${msg}`]);
      notify("Test failed — see log", false);
    }
    setRunning(false);
  };

  const btnP = { padding: "11px 24px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, letterSpacing: "0.03em", transition: "opacity 0.15s", cursor: "pointer" } as const;
  const btnS = { padding: "9px 18px", background: "transparent", color: "var(--text-muted)", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 12, transition: "all 0.15s", cursor: "pointer" } as const;

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Test Run</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Generate Captions</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-muted)" }}>
          Using flavor: <strong>{flavor.slug}</strong> · {sorted.length} step(s)
        </div>
      </div>

      {/* Flavor steps preview */}
      {sorted.length > 0 && (
        <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Prompt Chain</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sorted.map(s => (
              <div key={s.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces', serif", fontSize: 12, fontWeight: 600, flexShrink: 0, marginTop: 1 }}>{s.order_by}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{s.instruction}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image selector */}
      <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Select Test Image</div>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <button onClick={() => setUseCustom(false)} style={{ ...btnS, background: !useCustom ? "var(--accent-light)" : "transparent", borderColor: !useCustom ? "var(--accent)" : "var(--border)", color: !useCustom ? "var(--accent)" : "var(--text-muted)" }}>From test set</button>
          <button onClick={() => setUseCustom(true)} style={{ ...btnS, background: useCustom ? "var(--accent-light)" : "transparent", borderColor: useCustom ? "var(--accent)" : "var(--border)", color: useCustom ? "var(--accent)" : "var(--text-muted)" }}>Custom URL</button>
        </div>

        {useCustom ? (
          <input style={inp} placeholder="https://example.com/image.jpg" value={customUrl} onChange={e => setCustomUrl(e.target.value)} />
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8, marginBottom: 12 }}>
              {testImages.map(img => (
                <button key={img.id} onClick={() => setSelectedImageId(img.id)} style={{ padding: 0, border: `2px solid ${selectedImageId === img.id ? "var(--accent)" : "var(--border)"}`, borderRadius: 8, overflow: "hidden", background: "var(--surface2)", transition: "all 0.12s", cursor: "pointer" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.image_description ?? ""} style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </button>
              ))}
              {testImages.length === 0 && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-dim)", padding: "16px 0" }}>No common-use images found in database</div>
              )}
            </div>
            {selectedImage && (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Selected: {selectedImage.url}</div>
            )}
          </div>
        )}

        {/* Preview */}
        {imageUrl && (
          <div style={{ marginTop: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="preview" style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 8, border: "1.5px solid var(--border)", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        )}
      </div>

      {/* Run button */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button onClick={runTest} disabled={running || sorted.length === 0} style={{ ...btnP, opacity: running || sorted.length === 0 ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8 }}>
          {running ? (
            <><span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 14 }}>⟳</span> Running...</>
          ) : "▶ Run Test"}
        </button>
        {(captions.length > 0 || log.length > 0) && (
          <button onClick={() => { setCaptions([]); setLog([]); setError(null); }} style={btnS}>Clear</button>
        )}
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div style={{ background: "#0f0e0c", border: "1.5px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 24, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.8 }}>
          {log.map((line, i) => (
            <div key={i} style={{ color: line.startsWith("✗") ? "#f87171" : line.startsWith("✓") ? "#34d399" : line.startsWith("▶") ? "#fbbf24" : "#9ca3af" }}>{line}</div>
          ))}
          {running && <div style={{ color: "#9ca3af" }}>⟳ waiting for API...</div>}
        </div>
      )}

      {/* Captions */}
      {captions.length > 0 && (
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--accent3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Generated Captions ({captions.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {captions.map((c, i) => (
              <div key={c.id} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "18px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent3)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces', serif", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
                <p style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 300, fontStyle: "italic", color: "var(--text)", lineHeight: 1.6 }}>{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && captions.length === 0 && (
        <div style={{ background: "rgba(220,38,38,0.05)", border: "1.5px solid rgba(220,38,38,0.2)", borderRadius: 12, padding: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#dc2626" }}>
          <div style={{ marginBottom: 4, fontWeight: 600 }}>API Error</div>
          {error}
        </div>
      )}
    </div>
  );
}
