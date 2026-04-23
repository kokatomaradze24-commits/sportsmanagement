import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Validate coach token (coach id) → returns club user_id
async function resolveCoach(token: string | null) {
  if (!token) return null;
  const { data } = await supabaseAdmin
    .from("coaches")
    .select("id, user_id, is_active, display_name, username")
    .eq("id", token)
    .maybeSingle();
  if (!data || !data.is_active) return null;
  return data;
}

export const Route = createFileRoute("/api/coach/schedule")({
  server: {
    handlers: {
      // List practices + games for the coach's club
      GET: async ({ request }) => {
        const token = request.headers.get("x-coach-token");
        const coach = await resolveCoach(token);
        if (!coach) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const [{ data: practices }, { data: games }, { data: club }] = await Promise.all([
          supabaseAdmin
            .from("practices")
            .select("*")
            .eq("user_id", coach.user_id)
            .order("practice_date", { ascending: true }),
          supabaseAdmin
            .from("games")
            .select("*")
            .eq("user_id", coach.user_id)
            .order("game_date", { ascending: true }),
          supabaseAdmin
            .from("app_settings")
            .select("value")
            .eq("user_id", coach.user_id)
            .eq("key", "school_name")
            .maybeSingle(),
        ]);

        return Response.json({
          practices: practices ?? [],
          games: games ?? [],
          coach: { id: coach.id, displayName: coach.display_name, username: coach.username },
          clubName: club?.value ?? "Club",
        });
      },

      // Create practice or game
      POST: async ({ request }) => {
        const token = request.headers.get("x-coach-token");
        const coach = await resolveCoach(token);
        if (!coach) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const body = (await request.json()) as {
          kind: "practice" | "game";
          payload: Record<string, unknown>;
        };

        const base = {
          user_id: coach.user_id,
          coach_id: coach.id,
          ...body.payload,
        };

        if (body.kind === "practice") {
          const { data, error } = await supabaseAdmin.from("practices").insert(base as any).select().single();
          if (error) return Response.json({ error: error.message }, { status: 500 });
          return Response.json(data);
        } else {
          const { data, error } = await supabaseAdmin.from("games").insert(base as any).select().single();
          if (error) return Response.json({ error: error.message }, { status: 500 });
          return Response.json(data);
        }
      },

      // Update practice or game (coach can edit, not delete per requirement)
      PATCH: async ({ request }) => {
        const token = request.headers.get("x-coach-token");
        const coach = await resolveCoach(token);
        if (!coach) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const { kind, id, payload } = (await request.json()) as {
          kind: "practice" | "game";
          id: string;
          payload: Record<string, unknown>;
        };
        if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

        const table = kind === "practice" ? "practices" : "games";
        // Ensure the record belongs to the coach's club
        const { data: existing } = await supabaseAdmin
          .from(table)
          .select("id, user_id")
          .eq("id", id)
          .maybeSingle();
        if (!existing || existing.user_id !== coach.user_id) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }

        const { data, error } = await supabaseAdmin
          .from(table)
          .update(payload as any)
          .eq("id", id)
          .select()
          .single();
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json(data);
      },
    },
  },
});
