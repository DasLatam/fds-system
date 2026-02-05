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

function NavButtonLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800">
      {children}
    </Link>
  );
}

function NavPrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">
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

  const brandHref = user ? "/dashboard" : "/";

  return (
    <html lang="es">
      <body>
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href={brandHref} className="font-semibold">
              Firma Electrónica Simple
            </Link>

            <nav className="flex flex-wrap items-center justify-end gap-3">
              {user ? (
                <>
                  <NavLink href="/dashboard">Panel</NavLink>
                  <NavPrimaryLink href="/dashboard/new">Nueva firma</NavPrimaryLink>
                  <NavLink href="/dashboard/account">Cuenta</NavLink>
                  <NavLink href="/profile?next=/dashboard">Perfil</NavLink>
                  {isAdmin ? <NavLink href="/admin">Admin</NavLink> : null}
                  <form action="/api/logout" method="post" className="ml-1">
                    <button className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50">
                      Salir
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <NavLink href="/pricing">Planes</NavLink>
                  <NavLink href="/terms">Términos</NavLink>
                  <NavLink href="/privacy">Privacidad</NavLink>
                  <NavButtonLink href="/login">Ingresar</NavButtonLink>
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
              Este servicio implementa firma electrónica conforme a la Ley 25.506 (República Argentina). No constituye firma digital
              certificada en los términos de la misma ley.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
