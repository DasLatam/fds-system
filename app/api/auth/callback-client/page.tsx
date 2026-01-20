"use client";

import { useEffect } from "react";

function parseHashParams() {
  const hash = window.location.hash || "";
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(raw);

  return {
    access_token: params.get("access_token") ?? "",
    refresh_token: params.get("refresh_token") ?? "",
    expires_in: params.get("expires_in") ?? "",
    token_type: params.get("token_type") ?? "",
    type: params.get("type") ?? "",
    error: params.get("error") ?? "",
    error_description: params.get("error_description") ?? "",
  };
}

function safeNext(next?: string) {
  if (!next) return "/dashboard";
  if (!next.startsWith("/")) return "/dashboard";
  if (next.startsWith("//")) return "/dashboard";
  return next;
}

export default function AuthCallbackClient({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  useEffect(() => {
    const next = safeNext(searchParams?.next);

    const {
      access_token,
      refresh_token,
      error,
      error_description,
    } = parseHashParams();

    // Si Supabase devolvió error en el hash
    if (error) {
      const msg = encodeURIComponent(error_description || error);
      window.location.replace(`/login?error=auth_callback_failed&msg=${msg}`);
      return;
    }

    if (!access_token || !refresh_token) {
      // Esto es lo que te pasaba antes cuando ibas a /auth/callback (server): el hash no llega.
      window.location.replace(`/login?error=missing_tokens`);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/auth/set-session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ access_token, refresh_token }),
        });

        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          const msg = encodeURIComponent(j?.error || "set_session_failed");
          window.location.replace(
            `/login?error=auth_callback_failed&msg=${msg}`
          );
          return;
        }

        // Limpia hash para que no se reprocese si refrescás
        window.history.replaceState({}, "", `${window.location.pathname}?next=${encodeURIComponent(next)}`);

        window.location.replace(next);
      } catch (e: any) {
        const msg = encodeURIComponent(e?.message || "set_session_failed");
        window.location.replace(`/login?error=auth_callback_failed&msg=${msg}`);
      }
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