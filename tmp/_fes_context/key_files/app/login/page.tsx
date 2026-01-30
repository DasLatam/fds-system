"use client";

import { useState } from "react";

async function requestMagicLink(email: string) {
  const res = await fetch("/api/auth/magic-link", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error ? String(j.error) : "could_not_send");
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setSent(false);
    setLoading(true);

    try {
      await requestMagicLink(email);
      setSent(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "No se pudo enviar el enlace");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Ingresar</h1>
      <p className="mt-2 text-sm text-zinc-600">Login por Magic Link (Supabase Auth).</p>

      <form onSubmit={sendLink} className="mt-6 space-y-3">
        <input
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          type="email"
          autoComplete="email"
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white ${
            loading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {loading ? "Enviando…" : "Enviar link"}
        </button>

        {sent && <p className="text-sm text-emerald-700">Te enviamos un link de acceso a tu email.</p>}
        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
      </form>
    </div>
  );
}