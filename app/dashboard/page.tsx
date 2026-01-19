import Link from 'next/link'
import UploadForm from './UploadForm'
import { createSupabaseServerClient } from '../../lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user!

  const { data: docs } = await supabase
    .from('documents')
    .select('id,title,status,created_at,final_path')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-zinc-600">{user.email}</p>
        </div>
        <form action="/api/logout" method="post">
          <button className="rounded-xl border border-zinc-200 bg-white px-4 py-2">Salir</button>
        </form>
      </div>

      <UploadForm />

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Tus documentos</h2>
        <div className="mt-3 divide-y divide-zinc-100">
          {(docs || []).length === 0 ? (
            <p className="text-sm text-zinc-600">Todavía no subiste documentos.</p>
          ) : (
            (docs || []).map((d) => (
              <div key={d.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{d.title}</div>
                  <div className="text-sm text-zinc-600">
                    Estado: {d.status} · {new Date(d.created_at).toLocaleString('es-AR')}
                  </div>
                </div>
                {d.final_path ? (
                  <Link className="text-sm" href={`/api/download?path=${encodeURIComponent(d.final_path)}`}>
                    Descargar final
                  </Link>
                ) : (
                  <span className="text-sm text-zinc-500">Esperando firmas</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
