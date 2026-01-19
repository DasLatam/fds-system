import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Firma Digital Simple",
  description: "Firma electrónica simple, segura y legal en Argentina (Ley 25.506).",
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm text-zinc-700 hover:text-zinc-900">
      {children}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold">
              Firma Digital Simple
            </Link>
            <nav className="flex items-center gap-4">
              <NavLink href="/pricing">Planes</NavLink>
              <NavLink href="/terms">Términos</NavLink>
              <NavLink href="/privacy">Privacidad</NavLink>
              <Link
                href="/login"
                className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white"
              >
                Ingresar
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="border-t border-zinc-200">
          <div className="mx-auto max-w-5xl px-4 py-8 text-xs text-zinc-500">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>© {new Date().getFullYear()} Firma Digital Simple</div>
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
