"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AuthCallbackClientPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";

  useEffect(() => {
    // Si el link venía en formato implicit (#access_token=...), Supabase lo detecta acá
    // gracias a detectSessionInUrl:true en supabaseBrowser.
    // Con eso, ya debería quedar sesión guardada.
    (async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      if (data.session) {
        router.replace(next);
      } else {
        router.replace("/login?error=auth_failed");
      }
    })();
  }, [router, next]);

  return (
    <div className="p-6 text-sm text-zinc-700">
      Verificando acceso...
    </div>
  );
}