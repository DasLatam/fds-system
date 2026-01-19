"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AuthCallbackClientPage() {
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";

  useEffect(() => {
    (async () => {
      // Supabase (browser) consume implicit hash tokens (#access_token=...)
      // gracias a detectSessionInUrl:true en supabaseBrowser.
      const { data } = await supabaseBrowser.auth.getSession();

      if (data.session) {
        window.location.href = next;
      } else {
        window.location.href = "/login?error=auth_failed";
      }
    })();
  }, [next]);

  return <div className="p-6 text-sm text-zinc-700">Verificando acceso...</div>;
}