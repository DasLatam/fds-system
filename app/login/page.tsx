"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

function getRedirectTo() {
  // En prod: window.location.origin = https://firmadigitalsimple.vercel.app
  // En local: http://localhost:3000
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  return `${origin}/auth/callback?next=/dashboard`;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const redirectTo = getRedirectTo();

    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo, // ✅ ABSOLUTO SIEMPRE
      },
    });

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
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
        />

        <button className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
          Enviar link
        </button>

        {sent && (
          <p className="text-sm text-emerald-700">
            Te enviamos un link de acceso a tu email.
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}