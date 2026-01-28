"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";

async function sha256Hex(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", ab);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function maskEmail(email?: string) {
  if (!email) return "";
  const [u, d] = email.split("@");
  if (!d) return email;
  const user = u.length <= 2 ? u[0] + "*" : u.slice(0, 2) + "***";
  return `${user}@${d}`;
}

function normalizeCode(input: string) {
  try {
    return decodeURIComponent(String(input || "")).trim();
  } catch {
    return String(input || "").trim();
  }
}

export default function VerifyClient() {
  const params = useParams<{ code?: string }>();

  const [urlFallbackCode, setUrlFallbackCode] = useState<string>("");

  useEffect(() => {
    // fallback duro: /v/<code>
    if (typeof window !== "undefined") {
      const path = window.location.pathname || "";
      const parts = path.split("/").filter(Boolean); // ["v","6690..."]
      const code = parts[0] === "v" ? (parts[1] || "") : "";
      setUrlFallbackCode(code);
    }
  }, []);

  const rawCode = useMemo(() => {
    // prioridad: params.code, luego fallback por pathname
    return (params?.code as string) || urlFallbackCode || "";
  }, [params, urlFallbackCode]);

  const auditCode = useMemo(() => normalizeCode(rawCode), [rawCode]);

  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function onVerify() {
    setError(null);
    setResult(null);

    if (!auditCode) {
      setError("No se detectó el código de auditoría en la URL. Recargá la página y probá de nuevo.");
      return;
    }
    if (!file) {
      setError("Seleccioná un PDF para verificar.");
      return;
    }

    setBusy(true);
    try {
      const hash = await sha256Hex(file);

      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audit_code: auditCode, sha256: hash }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error verificando");

      setResult({ ...data, provided_sha256: hash });
    } catch (e: any) {
      setError(e?.message || "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700 }}>Validación pública del documento</h1>

      <div style={{ marginTop: 10, padding: 10, border: "1px dashed rgba(0,0,0,0.25)", borderRadius: 10 }}>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          <b>Debug params.code:</b> {(params?.code as string) || "(vacío)"}<br />
          <b>Debug pathname code:</b> {urlFallbackCode || "(vacío)"}<br />
          <b>Debug auditCode:</b> {auditCode || "(vacío)"}
        </div>
      </div>

      <p style={{ marginTop: 12, opacity: 0.85 }}>
        Código de auditoría: <b>{auditCode || "—"}</b>
      </p>

      <div style={{ marginTop: 20, padding: 16, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12 }}>
        <input
          id="pdf-file"
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={{ display: "none" }}
        />

        <label
          htmlFor="pdf-file"
          style={{
            display: "inline-block",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.18)",
            cursor: "pointer",
            fontWeight: 700,
            userSelect: "none",
          }}
        >
          📄 {file ? "Cambiar PDF" : "Subir PDF"}
        </label>

        {file && (
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
            Seleccionado: <b>{file.name}</b> ({Math.round(file.size / 1024)} KB)
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <button
            onClick={onVerify}
            disabled={busy || !file}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.18)",
              cursor: busy || !file ? "not-allowed" : "pointer",
              fontWeight: 700,
              opacity: busy || !file ? 0.6 : 1,
            }}
          >
            {busy ? "Verificando…" : "Verificar PDF"}
          </button>
        </div>

        {error && <div style={{ marginTop: 14, color: "#b00020" }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: result.match ? "rgba(0,128,0,0.08)" : "rgba(176,0,32,0.08)",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {result.match ? "✅ VÁLIDO" : "❌ NO VÁLIDO"}
              </div>

              <div style={{ marginTop: 10, fontFamily: "monospace", fontSize: 12, opacity: 0.85 }}>
                SHA-256 verificado: {result.provided_sha256}
              </div>
            </div>

            {result.document && (
              <div style={{ marginTop: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Detalle del documento</h2>
                <div style={{ marginTop: 8, lineHeight: 1.6 }}>
                  <div><b>Título:</b> {result.document.title}</div>
                  <div>
                    <b>Fecha de firma:</b>{" "}
                    {result.document.completed_at ? new Date(result.document.completed_at).toLocaleString() : "-"}
                  </div>
                  <div><b>Código de auditoría:</b> {result.document.audit_code}</div>
                </div>
              </div>
            )}

            {Array.isArray(result.signers) && (
              <div style={{ marginTop: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Firmantes</h2>
                <div style={{ marginTop: 8 }}>
                  {result.signers.map((s: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: 10,
                        border: "1px solid rgba(0,0,0,0.12)",
                        borderRadius: 12,
                        marginBottom: 8,
                      }}
                    >
                      <div><b>{s.full_name || "Firmante"}</b></div>
                      <div style={{ opacity: 0.85 }}>{maskEmail(s.email)}</div>
                      <div style={{ opacity: 0.85 }}>
                        {s.signed_at ? `Firmó: ${new Date(s.signed_at).toLocaleString()}` : `Estado: ${s.status}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}