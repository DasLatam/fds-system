import crypto from "crypto";

/**
 * Código corto, copiable, no adivinable.
 * Ej: FES-7H2K-9Q3D-1M8P
 */
export function makeAuditCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin O/0, I/1
  const rand = (n: number) =>
    Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `FES-${rand(4)}-${rand(4)}-${rand(4)}`;
}

export function sha256Hex(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
