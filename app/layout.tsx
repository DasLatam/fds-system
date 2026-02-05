import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/security/admin.server";

export const metadata: Metadata = {
  title: "Firma Electrónica Simple",
  description: "Firma electrónica simple, segura y legal en Argentina (Ley 25.506).",
};

export const dynamic = "force-dynamic";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm text-zinc-700 hover:text-zinc-900">
      {children}
    </Link>
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = (user?.email || "").toLowerCase();
  const isAdmin = Boolean(email) && isAdminEmail(email);

  return (
    <html lang="es">
      <body>
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href={user ? "/dashboard" : "/"} className="font-semibold">
              Firma Electrónica Simple
            </Link>

            {/*
              Menú inteligente:
              - Sin sesión: marketing (Planes / Legal) + Ingresar
              - Con sesión: navegación de producto + Salir
            */}
            <nav className="flex flex-wrap items-center justify-end gap-4">
              {!user ? (
                <>
                  <NavLink href="/pricing">Planes</NavLink>
                  <NavLink href="/terms">Términos</NavLink>
                  <NavLink href="/privacy">Privacidad</NavLink>

                  <Link href="/login" className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white">
                    Ingresar
                  </Link>
                </>
              ) : (
                <>
                  <NavLink href="/dashboard">Panel</NavLink>
                  <NavLink href="/dashboard/new">Nuevo documento</NavLink>
                  <NavLink href="/dashboard/account">Cuentas</NavLink>
                  <NavLink href="/profile?next=/dashboard">Mis datos</NavLink>
                  {isAdmin ? <NavLink href="/admin">Admin</NavLink> : null}

                  <form action="/api/logout" method="post">
                    <button className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-50">
                      Salir
                    </button>
                  </form>
                </>
              )}
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="border-t border-zinc-200">
          <div className="mx-auto max-w-5xl px-4 py-8 text-xs text-zinc-500">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>© {new Date().getFullYear()} Firma Electrónica Simple</div>
              <div className="flex items-center gap-4">
                <Link href="/terms" className="hover:text-zinc-800">
                  Términos
                </Link>
                <Link href="/privacy" className="hover:text-zinc-800">
                  Privacidad
                </Link>
                <Link href="/pricing" className="hover:text-zinc-800">
                  Planes
                </Link>
              </div>
            </div>
            <p className="mt-3 leading-relaxed">
              Este servicio implementa firma electrónica conforme a la Ley 25.506 (República Argentina). No constituye firma
              digital certificada en los términos de la misma ley.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
