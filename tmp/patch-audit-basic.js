const fs = require("fs");

const file = "app/api/sign/route.ts";
let s = fs.readFileSync(file, "utf8");

// 1) Insertar helper logAuditBasic si no existe
if (!s.includes("async function logAuditBasic(")) {
  const anchor = "function isValidEmail";
  const idx = s.indexOf(anchor);
  if (idx === -1) {
    console.error("No encontré function isValidEmail() para anclar el helper.");
    process.exit(1);
  }
  const after = s.slice(idx);
  const end = after.indexOf("\n}\n");
  if (end === -1) {
    console.error("No pude detectar el cierre de isValidEmail().");
    process.exit(1);
  }
  const insertPos = idx + end + "\n}\n".length;

  const helper = `
async function logAuditBasic(
  admin: any,
  evt: { document_id: string; event_type: string; actor_email?: string | null }
) {
  try {
    const r = await admin.from("audit_events").insert({
      document_id: evt.document_id,
      event_type: evt.event_type,
      actor_email: evt.actor_email ?? null,
    });
    if (r?.error) {
      console.error("audit_events insert failed:", evt.event_type, r.error);
    }
  } catch (e) {
    console.error("audit_events insert failed:", evt.event_type, e);
  }
}

`.trimStart();

  s = s.slice(0, insertPos) + "\n" + helper + s.slice(insertPos);
  console.log("OK: inserté logAuditBasic()");
} else {
  console.log("SKIP: logAuditBasic ya existe");
}

// 2) Asegurar document_completed después del update del doc firmado (sin payload)
if (!s.includes('event_type: "document_completed"') && !s.includes('event_type: "document_completed"')) {
  // Buscamos un lugar estable: después del update del documento a signed (updDoc) y antes del email final
  const marker = 'if (updDoc.error) {\n        return NextResponse.json({ error: "Failed to update document" }, { status: 500 });\n      }\n';
  const p = s.indexOf(marker);
  if (p === -1) {
    console.error("No encontré el bloque updDoc.error exacto. No modifiqué nada.");
    process.exit(1);
  }

  const insert = `
      // Auditoría: documento finalizado (firmado por todos)
      await logAuditBasic(admin, {
        document_id: documentId,
        event_type: "document_completed",
        actor_email: null,
      });

`;
  s = s.slice(0, p + marker.length) + insert + s.slice(p + marker.length);
  console.log('OK: inserté "document_completed"');
} else {
  console.log('SKIP: "document_completed" ya estaba presente');
}

// 3) En los lugares donde insertabas completion_email_* con payload, dejalo básico.
// Reemplazo simple: si existe una llamada a logAudit(...) o insert con payload, igual forzamos basic en el try/catch de completion.

if (!s.includes('event_type: "completion_email_sent"')) {
  // no tocamos si no existe esa lógica
  console.log('INFO: No encontré "completion_email_sent" en el archivo (no lo agrego).');
} else {
  // Si ya existen inserts, no los duplicamos; dejamos el básico como "seguro" agregándolo cerca del console.error("completion email failed")
  console.log("INFO: completion_email_* ya existe en el archivo. No duplico.");
}

fs.writeFileSync(file, s, "utf8");
console.log("DONE:", file);
