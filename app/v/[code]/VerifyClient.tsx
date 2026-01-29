"use client";

import { useParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";

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

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

type VerifyResponse = {
  ok: boolean;
  match?: boolean;
  reason?: string;
  provided_sha256?: string;
  document?: {
    title?: string;
    completed_at?: string;
    audit_code?: string;
    status?: string;
    final_hash_sha256?: string;
  };
  signers?: Array<{
    full_name?: string;
    email?: string;
    signed_at?: string;
    status?: string;
  }>;
  error?: string;
};

export default function VerifyClient() {
  const params = useParams<{ code?: string }>();

  const [urlFallbackCode, setUrlFallbackCode] = useState<string>("");

  useEffect(() => {
    // fallback duro: /v/<code>
    if (typeof window !== "undefined") {
      const path = window.location.pathname || "";
      const parts = path.split("/").filter(Boolean); // ["v","6690..."]
      const code = parts[0] === "v" ? parts[1] || "" : "";
      setUrlFallbackCode(code);
    }
  }, []);

  const rawCode = useMemo(() => {
    return (params?.code as string) || urlFallbackCode || "";
  }, [params, urlFallbackCode]);

  const auditCode = useMemo(() => normalizeCode(rawCode), [rawCode]);

  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  // Reset cuando cambia el archivo
  useEffect(() => {
    setResult(null);
    setError(null);
    setCopied(false);
  }, [file]);

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback mínimo
      setError("No se pudo copiar. Copialo manualmente.");
    }
  }

  function friendlyStatusError(status: number, statusText: string, serverMsg?: string) {
    // Si el server ya mandó una frase buena, la usamos.
    const base = serverMsg?.trim();
    if (base) return base;

    // Errores típicos
    if (status === 404) return "Código inválido. Revisá que el código de auditoría sea correcto.";
    if (status === 400) return "Solicitud inválida. Probá recargar la página e intentá de nuevo.";
    if (status === 405) return "Método no permitido. Probá recargar la página.";
    if (status === 500) return "Error interno del servidor. Probá nuevamente en unos minutos.";

    return `Error ${status} (${statusText || "desconocido"})`;
  }

  async function onVerify() {
    setError(null);
    setResult(null);
    setCopied(false);

    if (!auditCode) {
      setError("No se detectó el código de auditoría en la URL. Copiá y pegá el link nuevamente.");
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

      const data = (await res.json().catch(() => ({}))) as VerifyResponse;

      if (!res.ok) {
        throw new Error(friendlyStatusError(res.status, res.statusText, (data as any)?.error));
      }

      setResult({ ...data, provided_sha256: hash });
    } catch (e: any) {
      setError(e?.message || "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  const hasResult = !!result;
  const isValid = result?.match === true;
  const isInvalid = result?.match === false;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.2 }}>Verificación pública</h1>

      <p style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.5 }}>
        Subí el <b>PDF final</b> para verificar su integridad. El sistema compara la huella criptográfica (SHA-256) del
        archivo contra el registro de auditoría generado al momento de la firma en <b>Firma Electrónica Simple</b>.
      </p>

      <div style={{ marginTop: 14, opacity: 0.9 }}>
        <span style={{ fontSize: 13, opacity: 0.7 }}>Código de auditoría</span>
        <div style={{ fontFamily: "monospace", fontSize: 14, marginTop: 4 }}>{auditCode || "—"}</div>
      </div>

      <div
        style={{
          marginTop: 18,
          padding: 18,
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 16,
          boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
        }}
      >
        {/* Input oculto */}
        <input
          id="pdf-file"
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={{ display: "none" }}
        />

        {/* Botón seleccionar / cambiar */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <label
            htmlFor="pdf-file"
            style={{
              display: "inline-block",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.18)",
              cursor: "pointer",
              fontWeight: 800,
              userSelect: "none",
              background: hasResult ? "transparent" : "rgba(0,0,0,0.03)",
            }}
          >
            📄 {file ? "Cambiar PDF" : "Subir PDF"}
          </label>

          {file && (
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              Seleccionado: <b>{file.name}</b> ({Math.round(file.size / 1024)} KB)
            </div>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            onClick={onVerify}
            disabled={busy || !file}
            style={{
              padding: "11px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.18)",
              cursor: busy || !file ? "not-allowed" : "pointer",
              fontWeight: 900,
              opacity: busy || !file ? 0.6 : 1,
              background: "rgba(0,0,0,0.04)",
            }}
          >
            {busy ? "Verificando…" : "Verificar PDF"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(176,0,32,0.25)",
              background: "rgba(176,0,32,0.06)",
              color: "#b00020",
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                padding: 14,
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.12)",
                background: isValid
                  ? "rgba(0,128,0,0.08)"
                  : isInvalid
                    ? "rgba(176,0,32,0.08)"
                    : "rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 1000 }}>
                  {isValid
                    ? "✅ El documento es auténtico"
                    : isInvalid
                      ? "❌ El documento no coincide"
                      : "Resultado de la verificación"}
                </div>

                {result.provided_sha256 && (
                  <button
                    onClick={() => copyToClipboard(result.provided_sha256!)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.18)",
                      cursor: "pointer",
                      fontWeight: 900,
                      background: "white",
                    }}
                  >
                    {copied ? "✅ Copiado" : "Copiar hash"}
                  </button>
                )}
              </div>

              <div style={{ marginTop: 10, opacity: 0.92, lineHeight: 1.5 }}>
                {isValid && (
                  <span>
                    El archivo subido <b>coincide íntegramente</b> con el documento firmado y auditado. La integridad del
                    contenido está verificada.
                  </span>
                )}
                {isInvalid && (
                  <span>
                    El archivo subido <b>no coincide</b> con el documento auditado. El contenido pudo haber sido alterado
                    o no corresponde a este código de auditoría.
                  </span>
                )}
                {!isValid && !isInvalid && result.reason && <span>{result.reason}</span>}
              </div>

              {result.provided_sha256 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                    Huella criptográfica verificada (SHA-256)
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      opacity: 0.9,
                      wordBreak: "break-all",
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.10)",
                      background: "rgba(255,255,255,0.6)",
                    }}
                  >
                    {result.provided_sha256}
                  </div>
                </div>
              )}
            </div>

            {/* Detalle */}
            {result.document && (
              <div style={{ marginTop: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 8 }}>Detalle del documento</h2>
                <div style={{ lineHeight: 1.7 }}>
                  <div>
                    <span style={{ opacity: 0.7 }}>Título:</span> <b>{result.document.title || "—"}</b>
                  </div>
                  <div>
                    <span style={{ opacity: 0.7 }}>Fecha de firma:</span> <b>{formatDateTime(result.document.completed_at)}</b>
                  </div>
                  <div>
                    <span style={{ opacity: 0.7 }}>Código de auditoría:</span>{" "}
                    <span style={{ fontFamily: "monospace" }}>{result.document.audit_code || auditCode || "—"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Firmantes */}
            {Array.isArray(result.signers) && (
              <div style={{ marginTop: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 8 }}>Firmantes</h2>

                <div style={{ display: "grid", gap: 10 }}>
                  {result.signers.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 12,
                        border: "1px solid rgba(0,0,0,0.12)",
                        borderRadius: 14,
                        background: "rgba(0,0,0,0.02)",
                      }}
                    >
                      <div style={{ fontWeight: 900 }}>{s.full_name || "Firmante"}</div>
                      <div style={{ opacity: 0.85 }}>{maskEmail(s.email)}</div>
                      <div style={{ opacity: 0.85 }}>
                        {s.signed_at ? `Firmó: ${formatDateTime(s.signed_at)}` : `Estado: ${s.status || "—"}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 14, fontSize: 12, opacity: 0.7 }}>
              Nota: cualquier modificación del archivo, incluso mínima, invalida la verificación.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}