import Link from "next/link";

export const dynamic = "force-static";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Planes</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Por ahora la herramienta está 100% gratis. La suscripción se activará cuando haya tracción (sin sorpresas).
          </p>
        </div>
        <Link href="/login" className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
          Empezar gratis
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card title="Firmante" price="Gratis" bullets={["Siempre gratis para firmar", "Historial de firmas", "Acceso al PDF final"]} />
        <Card title="Personal" price="Gratis + packs" bullets={["1 subida gratis por semana", "Pack 1 subida: USD 1", "Pack 20 subidas: USD 15", "Historial completo"]} />
        <Card title="Empresas" price="Gratis + packs" bullets={["1 subida gratis por semana", "Pack 30 subidas: USD 20", "Auditoría por evento", "Export / integraciones (roadmap)"]} />
      </div>

      <p className="mt-8 text-xs text-zinc-500">
        *Los precios son la idea de producto; la facturación todavía no está integrada en esta versión.
      </p>
    </div>
  );
}

function Card({ title, price, bullets }: { title: string; price: string; bullets: string[] }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-medium text-zinc-600">{title}</div>
      <div className="mt-2 text-3xl font-semibold">{price}</div>
      <ul className="mt-4 space-y-2 text-sm text-zinc-600">
        {bullets.map((b) => (
          <li key={b}>• {b}</li>
        ))}
      </ul>
    </div>
  );
}
