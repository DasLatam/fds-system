"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export const dynamic = "force-dynamic";

type Status = { kind: "idle" | "busy" | "ok" | "error"; message?: string };

type FieldErrors = Partial<Record<"name" | "email" | "subject" | "message", string>>;

function isBlank(s: string) {
  return !String(s || "").trim();
}

export default function ContactPage() {
  const formRef = useRef<HTMLFormElement | null>(null);

  const siteKey = useMemo(() => {
    // NEXT_PUBLIC_* disponible en el cliente
    return (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim();
  }, []);

  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    // Cargar Turnstile solo en esta pagina
    const src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    if (document.querySelector(`script[src='${src}']`)) return;
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }, []);

  function validate(fd: FormData) {
    const nextErrors: FieldErrors = {};

    const name = String(fd.get("name") || "");
    const email = String(fd.get("email") || "");
    const subject = String(fd.get("subject") || "");
    const message = String(fd.get("message") || "");

    if (isBlank(name)) nextErrors.name = "Ingresá tu nombre.";
    if (isBlank(email) || !email.includes("@")) nextErrors.email = "Ingresá un email válido.";
    if (isBlank(subject)) nextErrors.subject = "Ingresá un asunto.";
    if (isBlank(message) || message.trim().length < 10) nextErrors.message = "Contanos un poco más (mínimo 10 caracteres).";

    return nextErrors;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "idle" });
    setErrors({});

    const form = formRef.current;
    if (!form) return;

    const fd = new FormData(form);
    const nextErrors = validate(fd);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const token = String(fd.get("cf-turnstile-response") || "").trim();
    if (!token) {
      setStatus({ kind: "error", message: "Completá el captcha para enviar el mensaje." });
      return;
    }

    setStatus({ kind: "busy", message: "Enviando..." });

    try {
      const r = await fetch("/api/contact", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        setStatus({ kind: "error", message: j?.error || "No se pudo enviar el mensaje." });
        return;
      }

      setStatus({ kind: "ok", message: "Mensaje enviado. Te respondemos a la brevedad." });
      form.reset();

      // Turnstile: el widget queda consumido; forzamos reload simple
      // (la API de Turnstile no siempre está lista para resetear de forma fiable en client-only)
      window.location.hash = "#ok";
      setTimeout(() => window.location.reload(), 250);
    } catch {
      setStatus({ kind: "error", message: "Error de red." });
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Contactanos</h1>
        <p className="mt-2 text-sm text-zinc-600">
          ¿Tenés una consulta comercial, técnica o legal? Escribinos y te respondemos por email.
        </p>
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium">Nombre</label>
            <input
              name="name"
              className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              placeholder="Tu nombre"
              autoComplete="name"
            />
            {errors.name ? <div className="mt-1 text-xs text-red-600">{errors.name}</div> : null}
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              placeholder="tu@email.com"
              autoComplete="email"
            />
            {errors.email ? <div className="mt-1 text-xs text-red-600">{errors.email}</div> : null}
          </div>

          <div>
            <label className="text-sm font-medium">Asunto</label>
            <input
              name="subject"
              className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              placeholder="Ej: Plan Empresa / Integración / Duda legal"
            />
            {errors.subject ? <div className="mt-1 text-xs text-red-600">{errors.subject}</div> : null}
          </div>

          <div>
            <label className="text-sm font-medium">Mensaje</label>
            <textarea
              name="message"
              rows={6}
              className="mt-1 w-full resize-y rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              placeholder="Contanos qué necesitás y, si aplica, el contexto (tipo de documento, volumen, etc.)."
            />
            {errors.message ? <div className="mt-1 text-xs text-red-600">{errors.message}</div> : null}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-sm font-medium">Protección anti-spam</div>
            <p className="mt-1 text-xs text-zinc-600">
              Usamos Cloudflare Turnstile para evitar que este formulario sea utilizado como SMTP.
            </p>

            {siteKey ? (
              <div className="mt-3">
                <div className="cf-turnstile" data-sitekey={siteKey} />
              </div>
            ) : (
              <p className="mt-3 text-xs text-amber-700">
                Falta configurar <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> en Vercel.
              </p>
            )}
          </div>

          {status.kind !== "idle" ? (
            <div
              className={
                "rounded-lg border p-3 text-sm " +
                (status.kind === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : status.kind === "error"
                    ? "border-red-200 bg-red-50 text-red-900"
                    : "border-zinc-200 bg-zinc-50 text-zinc-800")
              }
            >
              {status.message}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="submit"
              disabled={status.kind === "busy" || !siteKey}
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60"
            >
              {status.kind === "busy" ? "Enviando..." : "Enviar"}
            </button>

            <Link href="/pricing" className="text-sm text-zinc-600 hover:text-zinc-900">
              Ver planes
            </Link>
          </div>
        </div>
      </form>

      <p className="mt-6 text-xs text-zinc-500">
        Nota: este formulario es para consultas. Para soporte de un documento puntual, incluí el código de auditoría (si lo tenés).
      </p>
    </div>
  );
}
