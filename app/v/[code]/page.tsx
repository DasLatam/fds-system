"use client";

import { useMemo, useState } from "react";

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

export default function VerifyPage({ params }: { params: { code: string } }) {
  const auditCode = useMemo(() => decodeURIComponent(params.code || "").trim(), [params.code]);

  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function onVerify() {
    setError(null);
    setResult(null);

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
      <p style={{ marginTop: 8, opacity: 0.85 }}>
        Código de auditoría: <b>{auditCode}</b>
      </p>
      <p style={{ marginTop: 8, opacity: 0.85 }}>
        Subí el PDF que querés verificar. Calculamos su huella (SHA-256) en tu navegador y la comparamos con el
        documento final firmado.
      </p>

      <div style={{ marginTop: 20, padding: 16, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12 }}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <div style={{ marginTop: 12 }}>
          <button
            onClick={onVerify}
            disabled={busy || !file}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.18)",
              cursor: busy || !file ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Verificando…" : "Verificar PDF"}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 14, color: "#b00020" }}>
            {error}
          </div>
        )}

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
              {!result.match && result.reason && <div style={{ marginTop: 6 }}>{result.reason}</div>}
              <div style={{ marginTop: 10, fontFamily: "monospace", fontSize: 12, opacity: 0.85 }}>
                SHA-256 verificado: {result.provided_sha256}
              </div>
            </div>

            {result.document && (
              <div style={{ marginTop: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Detalle del documento</h2>
                <div style={{ marginTop: 8, lineHeight: 1.6 }}>
                  <div><b>Título:</b> {result.document.title}</div>
                  <div><b>Fecha de firma:</b> {result.document.completed_at ? new Date(result.document.completed_at).toLocaleString() : "-"}</div>
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

      <p style={{ marginTop: 16, fontSize: 13, opacity: 0.75 }}>
        Nota: si el PDF fue modificado (aunque sea 1 byte), el resultado será “No válido”.
      </p>
    </div>
  );
}