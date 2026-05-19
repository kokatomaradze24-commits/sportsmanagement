import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/player-registration")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const linkId = new URL(request.url).searchParams.get("linkId");
        if (!linkId) return Response.json({ error: "Missing link" }, { status: 400 });

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(linkId);
        const client = supabaseAdmin as any;
        const { data: link, error } = await client
          .from("player_registration_links")
          .select("id, user_id, sport, is_active")
          .eq(isUuid ? "id" : "short_code", linkId)
          .maybeSingle();

        if (error || !link?.is_active) return Response.json({ error: "Registration link is not active" }, { status: 404 });

        const { data: settings } = await client
          .from("app_settings")
          .select("key, value")
          .eq("user_id", link.user_id)
          .in("key", [`school_name:${link.sport}`, `logo_url:${link.sport}`, "ui_language"]);

        return Response.json({
          linkId: link.id,
          sport: link.sport,
          clubName: settings?.find((s: any) => s.key === `school_name:${link.sport}`)?.value ?? "Club",
          logoUrl: settings?.find((s: any) => s.key === `logo_url:${link.sport}`)?.value ?? "",
          language: settings?.find((s: any) => s.key === "ui_language")?.value ?? "ka",
        });
      },
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const linkId = String(body.linkId ?? "");
        const firstName = String(body.firstName ?? "").trim();
        const lastName = String(body.lastName ?? "").trim();
        const birthDate = String(body.birthDate ?? "").trim();
        const phone = String(body.phone ?? "").trim();
        const parentPhone = String(body.parentPhone ?? "").trim();
        const primaryContact = String(body.primaryContact ?? "player") === "parent" ? "parent" : "player";
        const experienceLevel = String(body.experienceLevel ?? "experienced") === "inexperienced" ? "inexperienced" : "experienced";
        const previousClub = String(body.previousClub ?? "").trim();
        const previousTeam = String(body.previousTeam ?? "").trim();
        const league = String(body.league ?? "").trim().toUpperCase();
        const lastCoach = String(body.lastCoach ?? "").trim();
        const notes = String(body.notes ?? "").trim();

        if (!linkId || !firstName || !lastName || !birthDate) {
          return Response.json({ error: "Required fields are missing" }, { status: 400 });
        }
        if ((primaryContact === "player" && !phone) || (primaryContact === "parent" && !parentPhone)) {
          return Response.json({ error: "Contact phone is required" }, { status: 400 });
        }
        if (experienceLevel === "experienced" && (!previousClub || !previousTeam || !["A", "B", "C"].includes(league) || !lastCoach)) {
          return Response.json({ error: "Experience details are required" }, { status: 400 });
        }
        if (new Date(birthDate) > new Date()) {
          return Response.json({ error: "Birth date is invalid" }, { status: 400 });
        }

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(linkId);
        const client = supabaseAdmin as any;
        const { data: link, error: linkError } = await client
          .from("player_registration_links")
          .select("id, user_id, sport, is_active")
          .eq(isUuid ? "id" : "short_code", linkId)
          .maybeSingle();

        if (linkError || !link?.is_active) return Response.json({ error: "Registration link is not active" }, { status: 404 });

        const { data: registration, error } = await client
          .from("player_registration_requests")
          .insert({
            link_id: linkId,
            user_id: link.user_id,
            sport: link.sport,
            first_name: firstName,
            last_name: lastName,
            birth_date: birthDate,
            phone: phone || null,
            parent_phone: parentPhone || null,
            primary_contact: primaryContact,
            experience_level: experienceLevel,
            previous_club: experienceLevel === "experienced" ? previousClub : null,
            previous_team: experienceLevel === "experienced" ? previousTeam : null,
            league: experienceLevel === "experienced" ? league : null,
            last_coach: experienceLevel === "experienced" ? lastCoach : null,
            notes: notes || null,
          })
          .select("id")
          .single();

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ ok: true, registrationId: registration.id });
      },
    },
  },
});