import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function authenticate(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return null;
  const { data, error } = await (supabaseAdmin as any).auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export const Route = createFileRoute("/api/ai/generate-training-plan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await authenticate(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        if (!LOVABLE_API_KEY) {
          return Response.json({ error: "AI gateway is not configured" }, { status: 500 });
        }

        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const sport = String(body.sport ?? "basketball");
        const ageGroup = String(body.ageGroup ?? "").trim();
        const period = body.period === "month" ? "month" : "week";
        const sessionsPerWeek = Math.max(1, Math.min(7, Number(body.sessionsPerWeek ?? 3)));
        const sessionMinutes = Math.max(30, Math.min(180, Number(body.sessionMinutes ?? 90)));
        const startDate = String(body.startDate ?? new Date().toISOString().slice(0, 10));
        const focus = String(body.focus ?? "").trim();
        const level = String(body.level ?? "intermediate");
        const language = String(body.language ?? "en");
        const mode = body.mode === "expert" ? "expert" : "self";
        const schedule = Array.isArray(body.schedule)
          ? (body.schedule as Array<{ date: string; start_time: string; end_time?: string | null }>)
          : [];

        const totalSessions =
          schedule.length > 0
            ? schedule.length
            : period === "week"
              ? sessionsPerWeek
              : sessionsPerWeek * 4;

        const expertNote =
          mode === "expert"
            ? "Act as a world-class professional club manager and head coach with decades of experience designing periodized training plans. Apply best practices in load management, progression, and skill development."
            : "Act as a helpful coaching assistant building a clear, simple, self-directed training plan for an independent coach.";

        const scheduleNote =
          schedule.length > 0
            ? `\nUse EXACTLY these fixed practice slots in order (do not invent other dates or times):\n${schedule
                .map(
                  (s, i) =>
                    `${i + 1}. ${s.date} ${s.start_time}${s.end_time ? `–${s.end_time}` : ""}`,
                )
                .join("\n")}`
            : "";

        const systemPrompt = `${expertNote}
You design ${sport} training plans for the "${ageGroup || "general"}" age group at ${level} level.
Return a structured plan that fits the period (${period}), with ${sessionsPerWeek} sessions per week, ${sessionMinutes} minutes each, starting on ${startDate}.
Reply ONLY by calling the provided tool. Write all text fields (title, notes) in language code "${language}".`;

        const userPrompt = `Build a ${period === "week" ? "1-week" : "1-month"} ${sport} training plan.
- Age group: ${ageGroup || "general"}
- Level: ${level}
- Sessions per week: ${sessionsPerWeek}
- Session length: ${sessionMinutes} minutes
- Start date: ${startDate}
- Special focus: ${focus || "balanced development"}${scheduleNote}
Generate exactly ${totalSessions} sessions${schedule.length > 0 ? " matching the fixed slots above (one session per slot, in order)" : " with realistic dates (no more than one per day, spread across the period)"}.
Each session must have:
- title: short focus title
- practice_date: YYYY-MM-DD${schedule.length > 0 ? " (must match the slot date)" : ` on or after ${startDate}`}
- start_time: HH:MM (24h)${schedule.length > 0 ? " (must match the slot start)" : ""}
- end_time: HH:MM (24h${schedule.length > 0 ? ", must match the slot end" : `, ${sessionMinutes} min after start`})
- notes: detailed plan with warm-up, main block, drills with reps/duration, cool-down. Use bullet points or short lines.`;

        const tools = [
          {
            type: "function",
            function: {
              name: "submit_training_plan",
              description: "Submit the training plan.",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  sessions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        practice_date: { type: "string" },
                        start_time: { type: "string" },
                        end_time: { type: "string" },
                        notes: { type: "string" },
                      },
                      required: ["title", "practice_date", "start_time", "end_time", "notes"],
                    },
                  },
                },
                required: ["summary", "sessions"],

              },
            },
          },
        ];


        // Training plan generation is free — no AI credits are charged.
        const refund = async () => { /* no-op: feature is free */ };


        try {
          const response = await fetch(GATEWAY_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: mode === "expert" ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              tools,
              tool_choice: { type: "function", function: { name: "submit_training_plan" } },
            }),
          });

          if (response.status === 429) {
            await refund();
            return Response.json({ error: "Rate limit exceeded. Please try again shortly." }, { status: 429 });
          }
          if (response.status === 402) {
            await refund();
            return Response.json({ error: "AI service temporarily unavailable. Please try again later." }, { status: 503 });
          }
          if (!response.ok) {
            await refund();
            const txt = await response.text();
            console.error("AI gateway error", response.status, txt);
            return Response.json({ error: "Plan generation failed" }, { status: 500 });
          }

          const data = await response.json();
          const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
          const argsStr = toolCall?.function?.arguments;
          if (!argsStr) {
            await refund();
            console.error("No tool call in response", JSON.stringify(data).slice(0, 500));
            return Response.json({ error: "AI returned no plan" }, { status: 500 });
          }
          let parsed: any;
          try {
            parsed = JSON.parse(argsStr);
          } catch {
            await refund();
            return Response.json({ error: "AI returned invalid plan" }, { status: 500 });
          }
          let sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
          if (schedule.length > 0) {
            sessions = schedule.map((slot, i) => ({
              title: sessions[i]?.title ?? `Session ${i + 1}`,
              practice_date: slot.date,
              start_time: slot.start_time,
              end_time: slot.end_time ?? "",
              notes: sessions[i]?.notes ?? "",
            }));
          }
          return Response.json({
            summary: parsed.summary ?? "",
            sessions,
          });
        } catch (err) {
          await refund();
          console.error("generate-training-plan exception", err);
          return Response.json({ error: "Plan generation failed" }, { status: 500 });
        }
      },
    },
  },
});
