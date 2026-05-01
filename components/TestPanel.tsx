"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Flavor, Step } from "./MainApp";

interface TestImage { id: string; url: string; image_description: string | null; }

interface Props {
  flavor: Flavor;
  steps: Step[];
  testImages: TestImage[];
  notify: (msg: string, ok?: boolean) => void;
}

interface Caption { id: string; content: string; }

const supabase = createClient();

export default function TestPanel({ flavor, steps, testImages, notify }: Props) {
  const [selectedImageId, setSelectedImageId] = useState<string>(testImages[0]?.id ?? "");
  const [customUrl, setCustomUrl] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...steps].sort((a, b) => a.order_by - b.order_by);
  const selectedImage = testImages.find(i => i.id === selectedImageId);

  const inp = { background: "var(--surface2)", border: "1.5px solid var(--border)", color: "var(--text)", borderRadius: 8, padding: "10px 14px", fontSize: 14, width: "100%", outline: "none", fontFamily: "'Syne', sans-serif" } as const;
  const btnP = { padding: "11px 24px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer" } as const;
  const btnS = { padding: "9px 18px", background: "transparent", color: "var(--text-muted)", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 12, cursor: "pointer" } as const;

  const addLog = (line: string) => setLog(l => [...l, line]);

  const runTest = async () => {
    setRunning(true); setLog([]); setCaptions([]); setError(null);
    const apiUrl = "https://api.almostcrackd.ai";

    try {
      // Get JWT token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated — please sign out and sign back in");

      const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

      let cdnUrl = "";

      if (uploadFile) {
        // Step 1: Get presigned URL
        addLog("① Getting presigned upload URL...");
        const presignRes = await fetch(`${apiUrl}/pipeline/generate-presigned-url`, {
          method: "POST", headers,
          body: JSON.stringify({ contentType: uploadFile.type }),
        });
        if (!presignRes.ok) throw new Error(`Presign failed: ${await presignRes.text()}`);
        const { presignedUrl, cdnUrl: cdn } = await presignRes.json();
        cdnUrl = cdn;

        // Step 2: Upload file
        addLog("② Uploading image...");
        const uploadRes = await fetch(presignedUrl, {
          method: "PUT",
          headers: { "Content-Type": uploadFile.type },
          body: uploadFile,
        });
        if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
        addLog("✓ Image uploaded");

      } else if (useCustom && customUrl) {
        cdnUrl = customUrl;
      } else if (selectedImage) {
        cdnUrl = selectedImage.url;
      } else {
        throw new Error("Select an image first");
      }

      // Step 3: Register image
      addLog("③ Registering image with pipeline...");
      const registerRes = await fetch(`${apiUrl}/pipeline/upload-image-from-url`, {
        method: "POST", headers,
        body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false }),
      });
      if (!registerRes.ok) throw new Error(`Register failed: ${await registerRes.text()}`);
      const { imageId } = await registerRes.json();
      addLog(`✓ Image registered (ID: ${imageId})`);

      // Step 4: Generate captions
      addLog(`④ Generating captions with flavor "${flavor.slug}"...`);
      const captionRes = await fetch(`${apiUrl}/pipeline/generate-captions`, {
        method: "POST", headers,
        body: JSON.stringify({ imageId, humorFlavorId: flavor.id }),
      });
      if (!captionRes.ok) throw new Error(`Caption generation failed: ${await captionRes.text()}`);
      const data = await captionRes.json();
      addLog("✓ Captions generated!");

      const raw: string[] = Array.isArray(data)
        ? data.map((c: Record<string, unknown>) => String(c.content ?? c.caption ?? c))
        : data.captions ?? data.results ?? [];

      if (raw.length > 0) {
        setCaptions(raw.map((c, i) => ({ id: String(i), content: c })));
      } else {
        addLog(`Raw response: ${JSON.stringify(data).slice(0, 300)}`);
      }

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      addLog(`✗ ${msg}`);
      notify("Test failed", false);
    }
    setRunning(false);
  };

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Test Run</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Generate Captions</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-muted)" }}>
          Flavor: <strong>{flavor.slug}</strong> · {sorted.length} step(s)
        </div>
      </div>

      {/* Steps preview */}
      {sorted.length > 0 && (
        <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Prompt Chain</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sorted.map(s => (
              <div key={s.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces', serif", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{s.order_by}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{s.llm_system_prompt}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image selector */}
      <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Select Image</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" as const }}>
          {(["testset", "url", "upload"] as const).map(mode => (
            <button key={mode} onClick={() => { setUseCustom(mode === "url"); setUploadFile(null); if (mode !== "url") setCustomUrl(""); }}
              style={{ ...btnS, background: (!useCustom && !uploadFile && mode === "testset") || (useCustom && mode === "url") || (uploadFile && mode === "upload") ? "var(--accent-light)" : "transparent", borderColor: (!useCustom && !uploadFile && mode === "testset") || (useCustom && mode === "url") || (uploadFile && mode === "upload") ? "var(--accent)" : "var(--border)", color: (!useCustom && !uploadFile && mode === "testset") || (useCustom && mode === "url") || (uploadFile && mode === "upload") ? "var(--accent)" : "var(--text-muted)", fontSize: 11 }}>
              {mode === "testset" ? "Test set" : mode === "url" ? "Custom URL" : "Upload file"}
            </button>
          ))}
        </div>

        {uploadFile ? (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--accent3)" }}>
            ✓ {uploadFile.name} selected
            <button onClick={() => setUploadFile(null)} style={{ marginLeft: 12, ...btnS, padding: "4px 10px", fontSize: 10 }}>Remove</button>
          </div>
        ) : useCustom ? (
          <input style={inp} placeholder="https://example.com/image.jpg" value={customUrl} onChange={e => setCustomUrl(e.target.value)} />
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginBottom: 8 }}>
              {testImages.map(img => (
                <button key={img.id} onClick={() => setSelectedImageId(img.id)} style={{ padding: 0, border: `2px solid ${selectedImageId === img.id ? "var(--accent)" : "var(--border)"}`, borderRadius: 8, overflow: "hidden", background: "var(--surface2)", cursor: "pointer" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" style={{ width: "100%", height: 70, objectFit: "cover", display: "block" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </button>
              ))}
              {testImages.length === 0 && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-dim)" }}>No test images found</div>}
            </div>
          </div>
        )}

        {!uploadFile && (
          <div style={{ marginTop: 12 }}>
            <label style={{ ...btnS, display: "inline-block", cursor: "pointer", fontSize: 11 }}>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) { setUploadFile(e.target.files[0]); setUseCustom(false); } }} />
              📁 Or upload a new image
            </label>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button onClick={runTest} disabled={running || sorted.length === 0} style={{ ...btnP, opacity: running || sorted.length === 0 ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8 }}>
          {running ? "Running..." : "▶ Run Test"}
        </button>
        {(captions.length > 0 || log.length > 0) && (
          <button onClick={() => { setCaptions([]); setLog([]); setError(null); }} style={btnS}>Clear</button>
        )}
      </div>

      {log.length > 0 && (
        <div style={{ background: "#0f0e0c", border: "1.5px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 24, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.8 }}>
          {log.map((line, i) => (
            <div key={i} style={{ color: line.startsWith("✗") ? "#f87171" : line.startsWith("✓") ? "#34d399" : line.startsWith("①") || line.startsWith("②") || line.startsWith("③") || line.startsWith("④") ? "#fbbf24" : "#9ca3af" }}>{line}</div>
          ))}
        </div>
      )}

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
          <div style={{ marginBottom: 4, fontWeight: 600 }}>Error</div>
          {error}
        </div>
      )}
    </div>
  );
}
