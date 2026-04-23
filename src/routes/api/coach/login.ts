import { createFileRoute } from "@tanstack/react-router";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/coach/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { username, password } = (await request.json()) as {
            username?: string;
            password?: string;
          };
          if (!username || !password) {
            return Response.json({ error: "Username and password are required" }, { status: 400 });
          }

          const { data: coach, error } = await supabaseAdmin
            .from("coaches")
            .select("id, user_id, username, password_hash, display_name, is_active")
            .eq("username", username.trim().toLowerCase())
            .maybeSingle();

          if (error || !coach || !coach.is_active) {
            return Response.json({ error: "Invalid credentials" }, { status: 401 });
          }

          const ok = await bcrypt.compare(password, coach.password_hash);
          if (!ok) {
            return Response.json({ error: "Invalid credentials" }, { status: 401 });
          }

          // Look up club name
          const { data: setting } = await supabaseAdmin
            .from("app_settings")
            .select("value")
            .eq("user_id", coach.user_id)
            .eq("key", "school_name")
            .maybeSingle();

          return Response.json({
            coachId: coach.id,
            username: coach.username,
            displayName: coach.display_name,
            clubUserId: coach.user_id,
            clubName: setting?.value ?? "Club",
            token: coach.id, // simple token; server re-checks on each call
          });
        } catch (e) {
          return Response.json({ error: "Login failed" }, { status: 500 });
        }
      },
    },
  },
});
