import { Resend } from "resend";

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing env var: RESEND_API_KEY");
  return new Resend(key);
}

export function getFromEmail() {
  const from = process.env.RESEND_FROM;
  if (!from) throw new Error("Missing env var: RESEND_FROM");
  return from;
}
