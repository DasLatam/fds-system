import { createHash } from "crypto";

export function sha256Hex(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

export function sha256HexFromString(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}
