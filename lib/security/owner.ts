export function isOwnerEmail(email?: string | null) {
  if (!email) return false;
  const raw = process.env.FDS_OWNER_EMAILS || "";
  const owners = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return owners.includes(email.toLowerCase());
}
