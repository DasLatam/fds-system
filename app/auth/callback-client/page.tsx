"use client";

import { useEffect, useRef, useState } from "react";

function parseHash(hash: string) {
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(h);
  return {
    access_token: params.get("access_token") || "",
    refresh_token: params.get("refresh_token") || "",
    error: params.get("error") || "",
    error_description: params.get("error_description") || "",
  };
}

function safeNextPath(next: string | null) {
  if (!next) return "/dashboard";
  if (!next.startsWith("/")) return "/dashboard";
  if (next.startsWith("//")) return "/dashboard";
  return next;
}

export default function AuthCallbackClient() {
  const ran = useRef(false);
  const [status, setStatus] = useState<string>("Iniciando…");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const url = new URL(window.location.href);

        // Si por alguna razón llega PKCE (?code=), lo delegamos al server callback
        const code = url.searchParams.get("code");
        const next = safeNextPath(url.searchParams.get("next"));

        if (code) {
          setStatus("Validando código…");
          window.location.replace(`/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`);
          return;
        }

        // Flow hash (#access_token=...&refresh_token=...)
        const { access_token, refresh_token, error, error_description } = parseHash(window.location.hash);

        if (error) {
          const msg = encodeURIComponent(error_description || error);
          window.location.replace(`/login?error=oauth_error&msg=${msg}`);
          return;
        }

        if (!access_token || !refresh_token) {
          // Si no hay tokens, probablemente es un link viejo o redirect incorrecto
          window.location.replace(`/login?error=missing_tokens`);
          return;
        }

        setStatus("Creando sesión…");

        const r = await fetch("/api/auth/set-session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ access_token, refresh_token }),
        });

        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          const msg = encodeURIComponent(j?.error || "set_session_failed");
          window.location.replace(`/login?error=set_session_failed&msg=${msg}`);
          return;
        }

        // Limpia el hash (evita reintentos / leaks en URL)
        window.history.replaceState({}, "", `${url.pathname}${url.search}`);

        // Redirige
        window.location.replace(next);
      } catch (e: any) {
        const msg = encodeURIComponent(e?.message || "callback_client_error");
        window.location.replace(`/login?error=callback_client_error&msg=${msg}`);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Ingresando…</h1>
      <p className="mt-2 text-sm text-zinc-600">{status}</p>
    </div>
  );
}