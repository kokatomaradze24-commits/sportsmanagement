import { createFileRoute } from "@tanstack/react-router";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

async function getCallerUserId(request: Request): Promise<string | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const sb = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
  const { data, error } = await sb.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

export const Route = createFileRoute("/api/coach/reset-password")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const userId = await getCallerUserId(request);
        if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const { coachId, newPassword } = (await request.json()) as {
          coachId?: string;
          newPassword?: string;
        };
        if (!coachId || !newPassword || newPassword.length < 6) {
          return Response.json({ error: "Bad input" }, { status: 400 });
        }

        // Verify ownership
        const { data: coach } = await supabaseAdmin
          .from("coaches")
          .select("id, user_id")
          .eq("id", coachId)
          .maybeSingle();
        if (!coach || coach.user_id !== userId) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        const password_hash = await bcrypt.hash(newPassword, 10);
        const { error } = await supabaseAdmin
          .from("coaches")
          .update({ password_hash, generated_password: newPassword })
          .eq("id", coachId);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
