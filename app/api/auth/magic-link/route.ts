import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMagicLinkEmail } from "@/lib/mail/send";

export const runtime = "nodejs";

const BodySchema = z.object({
  email: z.string().email(),
});

function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return appUrl.replace(/\/$/, "");
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const appUrl = getAppUrl();
  const redirectTo = `${appUrl}/auth/callback?next=/dashboard`;

  const admin = createAdminClient();

  // Supabase generates a one-time login link (PKCE) that lands on our callback.
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo,
    },
  });

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: "could_not_generate_link" }, { status: 500 });
  }

  await sendMagicLinkEmail({
    to: email,
    loginUrl: data.properties.action_link,
    appUrl,
  });

  return NextResponse.json({ ok: true });
}
