"use client";

import { useEffect } from "react";

function parseHash(hash: string) {
  // hash viene tipo: #access_token=...&refresh_token=...&expires_in=...
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(h);
  return {
    access_token: params.get("access_token") || "",
    refresh_token: params.get("refresh_token") || "",
    next: params.get("next") || "",
  };
}

export default function AuthCallbackClient({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  useEffect(() => {
    const next = (searchParams?.next && searchParams.next.startsWith("/"))
      ? searchParams.next
      : "/dashboard";

    const { access_token, refresh_token } = parseHash(window.location.hash);

    if (!access_token || !refresh_token) {
      window.location.replace(`/login?error=missing_tokens`);
      return;
    }

    (async () => {
      const res = await fetch("/api/auth/set-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ access_token, refresh_token }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const msg = encodeURIComponent(j?.error || "set_session_failed");
        window.location.replace(`/login?error=auth_callback_failed&msg=${msg}`);
        return;
      }

      // Limpia el hash y navega al destino
      window.location.replace(next);
    })();
  }, [searchParams]);

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Ingresando…</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Estamos validando tu acceso de forma segura.
      </p>
    </div>
  );
}