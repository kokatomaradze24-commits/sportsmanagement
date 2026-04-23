import { createFileRoute } from "@tanstack/react-router";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

// Helper: validate the caller is an authenticated club owner via Supabase JWT.
async function getCallerUserId(request: Request): Promise<string | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const sb = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
  const { data, error } = await sb.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub as string;
}

export const Route = createFileRoute("/api/coach/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const userId = await getCallerUserId(request);
        if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

        try {
          const body = (await request.json()) as {
            username?: string;
            password?: string;
            displayName?: string;
            sport?: string;
          };
          const username = (body.username ?? "").trim().toLowerCase();
          const password = body.password ?? "";
          const displayName = (body.displayName ?? "").trim();
          const sport = (body.sport ?? "basketball").trim();

          if (!username || !password || !displayName) {
            return Response.json({ error: "Missing fields" }, { status: 400 });
          }
          if (username.length < 3 || password.length < 6) {
            return Response.json({ error: "Username/password too short" }, { status: 400 });
          }

          // Check uniqueness
          const { data: existing } = await supabaseAdmin
            .from("coaches")
            .select("id")
            .eq("username", username)
            .maybeSingle();
          if (existing) {
            return Response.json({ error: "Username already taken" }, { status: 409 });
          }

          const password_hash = await bcrypt.hash(password, 10);

          const { data, error } = await supabaseAdmin
            .from("coaches")
            .insert({
              user_id: userId,
              username,
              password_hash,
              generated_password: password, // stored so club owner can show it later
              display_name: displayName,
              sport,
            })
            .select("id, username, display_name, generated_password, is_active, created_at")
            .single();

          if (error) return Response.json({ error: error.message }, { status: 500 });
          return Response.json(data);
        } catch (e: any) {
          return Response.json({ error: e?.message ?? "Failed" }, { status: 500 });
        }
      },
    },
  },
});
