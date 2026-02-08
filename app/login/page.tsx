"use client";

import { useState } from "react";

const CTA_PRIMARY =
  "inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:opacity-60";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    const em = email.trim().toLowerCase();
    if (!em || !em.includes("@")) {
      setStatus("Ingresá un email válido.");
      return;
    }

    setBusy(true);

    try {
      const r = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: em }),
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        setStatus(j?.error || "No se pudo enviar el enlace. Probá nuevamente.");
        return;
      }

      setStatus("Listo: te enviamos un enlace de acceso. Revisá tu bandeja de entrada (y spam). ");
    } catch {
      setStatus("Error de red. Probá nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Ingresar</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Accedé a tu cuenta con <span className="font-medium text-zinc-900">Magic Link</span>: te enviamos un correo con un enlace único y de un solo uso.
      </p>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
        <div className="font-semibold text-zinc-900">¿Cómo funciona?</div>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            Ingresás tu email y te enviamos un <span className="font-medium">link de acceso</span>.
          </li>
          <li>
            El link suele ser de <span className="font-medium">único uso</span> y con validez temporal.
          </li>
          <li>
            Una vez que entrás, la sesión queda activa hasta que cierres sesión o el navegador la invalide.
          </li>
          <li>
            Para volver a entrar más adelante, simplemente solicitás <span className="font-medium">un nuevo link</span>.
          </li>
          <li>
            Esto mejora la seguridad: validamos que realmente controlás ese email y evitamos contraseñas reutilizadas.
          </li>
        </ul>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <label className="block text-sm font-medium text-zinc-700">Email</label>
        <input
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          autoComplete="email"
          inputMode="email"
        />

        <button type="submit" className={CTA_PRIMARY} disabled={busy}>
          {busy ? "Enviando..." : "Enviar enlace de acceso"}
        </button>

        {status ? <p className="text-sm text-zinc-700">{status}</p> : null}

        <p className="pt-2 text-xs leading-relaxed text-zinc-500">
          Si no te llega el correo, revisá Spam/Promociones y asegurate de que el dominio no esté bloqueado.
        </p>
      </form>
    </div>
  );
}
