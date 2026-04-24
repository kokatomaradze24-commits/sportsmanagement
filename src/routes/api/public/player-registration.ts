import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getSeasonRegistrationDefaults } from "@/lib/season";

export const Route = createFileRoute("/api/public/player-registration")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const linkId = new URL(request.url).searchParams.get("linkId");
        if (!linkId) return Response.json({ error: "Missing link" }, { status: 400 });

        const client = supabaseAdmin as any;
        const { data: link, error } = await client
          .from("player_registration_links")
          .select("id, user_id, sport, is_active")
          .eq("id", linkId)
          .maybeSingle();

        if (error || !link?.is_active) return Response.json({ error: "Registration link is not active" }, { status: 404 });

        const { data: settings } = await client
          .from("app_settings")
          .select("key, value")
          .eq("user_id", link.user_id)
          .in("key", [`school_name:${link.sport}`, `logo_url:${link.sport}`]);

        return Response.json({
          linkId: link.id,
          sport: link.sport,
          clubName: settings?.find((s: any) => s.key === `school_name:${link.sport}`)?.value ?? "Club",
          logoUrl: settings?.find((s: any) => s.key === `logo_url:${link.sport}`)?.value ?? "",
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
        const email = String(body.email ?? "").trim();
        const notes = String(body.notes ?? "").trim();
        const preferredNumber = Number(body.tNumber);

        if (!linkId || !firstName || !lastName || !birthDate) {
          return Response.json({ error: "Required fields are missing" }, { status: 400 });
        }
        if (new Date(birthDate) > new Date()) {
          return Response.json({ error: "Birth date is invalid" }, { status: 400 });
        }

        const client = supabaseAdmin as any;
        const { data: link, error: linkError } = await client
          .from("player_registration_links")
          .select("user_id, sport, is_active")
          .eq("id", linkId)
          .maybeSingle();

        if (linkError || !link?.is_active) return Response.json({ error: "Registration link is not active" }, { status: 404 });

        let tNumber = Number.isFinite(preferredNumber) && preferredNumber >= 0 ? Math.floor(preferredNumber) : null;
        if (tNumber === null) {
          const { data: lastPlayer } = await client
            .from("players")
            .select("t_number")
            .eq("user_id", link.user_id)
            .eq("sport", link.sport)
            .order("t_number", { ascending: false })
            .limit(1)
            .maybeSingle();
          tNumber = Number(lastPlayer?.t_number ?? 0) + 1;
        }

        const seasonDefaults = getSeasonRegistrationDefaults(new Date());
        const { data: player, error } = await client
          .from("players")
          .insert({
            user_id: link.user_id,
            sport: link.sport,
            first_name: firstName,
            last_name: lastName,
            t_number: tNumber,
            birth_date: birthDate,
            phone: phone || null,
            parent_phone: parentPhone || null,
            email: email || null,
            notes: notes || null,
            primary_contact: parentPhone ? "parent" : "player",
            monthly_fee: 0,
            subscription_months: seasonDefaults.subscriptionMonths,
            start_month: seasonDefaults.startMonth,
            start_year: seasonDefaults.startYear,
            start_day: 1,
          })
          .select("id")
          .single();

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ ok: true, playerId: player.id });
      },
    },
  },
});