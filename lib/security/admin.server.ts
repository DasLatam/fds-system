import "server-only";

function parseAdminEmails(raw: string | undefined) {
  return new Set(
    String(raw || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

let cached: Set<string> | null = null;

export function getAdminEmailSet() {
  // ✅ Se cachea por proceso (serverless podría reiniciar, ok)
  if (!cached) cached = parseAdminEmails(process.env.FES_ADMIN_EMAILS);
  return cached;
}

export function isAdminEmail(email: string) {
  const set = getAdminEmailSet();
  return set.has(String(email || "").trim().toLowerCase());
}
