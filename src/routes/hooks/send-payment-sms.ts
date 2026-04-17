import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Format YYYY-MM-DD in UTC
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Compute the due date for a payment (year, month, start_day clamped to 28)
function dueDate(year: number, month: number, startDay: number): Date {
  const day = Math.min(Math.max(1, startDay), 28);
  return new Date(Date.UTC(year, month - 1, day));
}

interface PlayerLite {
  id: string;
  first_name: string;
  last_name: string;
  parent_phone: string | null;
  start_day: number;
}

interface PaymentLite {
  id: string;
  player_id: string;
  user_id: string;
  amount: number;
  month: number;
  year: number;
  status: string;
}

interface UserSmsSettings {
  user_id: string;
  enabled: boolean;
  provider: "magti" | "twilio";
  magti_api_key: string | null;
  magti_sender: string | null;
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  twilio_from: string | null;
  reminder_days_before: number;
  send_reminder: boolean;
  send_overdue: boolean;
}

async function sendMagti(
  apiKey: string,
  sender: string | null,
  to: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  // SMSOffice.ge API — https://smsoffice.ge/api/v2/send/
  const params = new URLSearchParams({
    key: apiKey,
    destination: to.replace(/\D/g, ""),
    sender: sender || "Info",
    content: text,
  });
  try {
    const res = await fetch(`https://smsoffice.ge/api/v2/send/?${params.toString()}`);
    const body = await res.text();
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    // SMSOffice returns JSON like {"Success":true,...} or {"Success":false,"ErrorCode":...}
    try {
      const json = JSON.parse(body);
      if (json.Success === false) return { ok: false, error: `Magti: ${JSON.stringify(json).slice(0, 200)}` };
    } catch {
      // Some endpoints return plain text "OK"; treat 2xx as success
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

async function sendTwilio(
  sid: string,
  token: string,
  from: string,
  to: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: text }),
      }
    );
    const body = await res.text();
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

function buildMessage(
  kind: "reminder" | "overdue",
  playerName: string,
  amount: number,
  due: Date
): string {
  const dueStr = `${due.getUTCDate().toString().padStart(2, "0")}.${(due.getUTCMonth() + 1).toString().padStart(2, "0")}.${due.getUTCFullYear()}`;
  if (kind === "reminder") {
    return `${playerName}: payment ${amount} due on ${dueStr}. Please pay on time. Thank you.`;
  }
  return `${playerName}: payment ${amount} (due ${dueStr}) is overdue. Please pay as soon as possible.`;
}

export const Route = createFileRoute("/hooks/send-payment-sms")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth: cron uses anon key as bearer; we accept any non-empty bearer
        // because Lovable-Context: cron is also expected.
        const auth = request.headers.get("authorization");
        if (!auth || !auth.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const today = new Date();
        const todayStr = ymd(today);

        // 1) Fetch all enabled SMS settings
        const { data: settingsRows, error: sErr } = await supabaseAdmin
          .from("user_sms_settings")
          .select("*")
          .eq("enabled", true);

        if (sErr) {
          return new Response(JSON.stringify({ error: sErr.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const settingsList = (settingsRows ?? []) as UserSmsSettings[];
        if (settingsList.length === 0) {
          return Response.json({ ok: true, processed: 0, message: "No users with SMS enabled" });
        }

        const userIds = settingsList.map((s) => s.user_id);

        // 2) Fetch pending/overdue payments for those users
        const { data: paymentsRows } = await supabaseAdmin
          .from("payments")
          .select("id, player_id, user_id, amount, month, year, status")
          .in("user_id", userIds)
          .in("status", ["pending", "overdue"]);

        const payments = (paymentsRows ?? []) as PaymentLite[];
        if (payments.length === 0) {
          return Response.json({ ok: true, processed: 0, message: "No outstanding payments" });
        }

        // 3) Fetch related players
        const playerIds = Array.from(new Set(payments.map((p) => p.player_id)));
        const { data: playersRows } = await supabaseAdmin
          .from("players")
          .select("id, first_name, last_name, parent_phone, start_day")
          .in("id", playerIds);

        const playerMap = new Map<string, PlayerLite>();
        (playersRows ?? []).forEach((p) => playerMap.set(p.id, p as PlayerLite));

        // 4) Fetch existing logs for today to dedupe (avoid double-sending same day)
        const startOfDay = new Date(today);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const { data: logsRows } = await supabaseAdmin
          .from("sms_logs")
          .select("payment_id, kind, status")
          .in("user_id", userIds)
          .gte("created_at", startOfDay.toISOString());

        const sentToday = new Set<string>();
        (logsRows ?? []).forEach((l) => {
          if (l.status === "sent" && l.payment_id) {
            sentToday.add(`${l.payment_id}:${l.kind}`);
          }
        });

        let sentCount = 0;
        let failedCount = 0;
        let skippedCount = 0;

        for (const settings of settingsList) {
          const userPayments = payments.filter((p) => p.user_id === settings.user_id);

          for (const pmt of userPayments) {
            const player = playerMap.get(pmt.player_id);
            if (!player || !player.parent_phone) {
              skippedCount++;
              continue;
            }

            const due = dueDate(pmt.year, pmt.month, player.start_day);
            const dueStr = ymd(due);

            // Decide reminder vs overdue
            let kind: "reminder" | "overdue" | null = null;
            if (pmt.status === "overdue" && settings.send_overdue) {
              kind = "overdue";
            } else if (pmt.status === "pending" && settings.send_reminder) {
              const diffDays = Math.round(
                (due.getTime() - startOfDay.getTime()) / (1000 * 60 * 60 * 24)
              );
              if (diffDays === settings.reminder_days_before && dueStr >= todayStr) {
                kind = "reminder";
              }
            }
            if (!kind) {
              skippedCount++;
              continue;
            }

            const dedupeKey = `${pmt.id}:${kind}`;
            if (sentToday.has(dedupeKey)) {
              skippedCount++;
              continue;
            }

            const playerName = `${player.first_name} ${player.last_name}`;
            const text = buildMessage(kind, playerName, pmt.amount, due);

            let result: { ok: boolean; error?: string };
            if (settings.provider === "magti") {
              if (!settings.magti_api_key) {
                result = { ok: false, error: "Missing Magti API key" };
              } else {
                result = await sendMagti(
                  settings.magti_api_key,
                  settings.magti_sender,
                  player.parent_phone,
                  text
                );
              }
            } else {
              if (!settings.twilio_account_sid || !settings.twilio_auth_token || !settings.twilio_from) {
                result = { ok: false, error: "Missing Twilio credentials" };
              } else {
                result = await sendTwilio(
                  settings.twilio_account_sid,
                  settings.twilio_auth_token,
                  settings.twilio_from,
                  player.parent_phone,
                  text
                );
              }
            }

            if (result.ok) sentCount++;
            else failedCount++;

            await supabaseAdmin.from("sms_logs").insert({
              user_id: settings.user_id,
              player_id: player.id,
              payment_id: pmt.id,
              phone: player.parent_phone,
              message: text,
              kind,
              provider: settings.provider,
              status: result.ok ? "sent" : "failed",
              error: result.error ?? null,
            });
          }
        }

        return Response.json({
          ok: true,
          sent: sentCount,
          failed: failedCount,
          skipped: skippedCount,
          users: settingsList.length,
        });
      },
    },
  },
});
