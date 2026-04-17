import { supabase } from "@/integrations/supabase/client";

export type NotificationKind = "registration" | "schedule" | "payment_paid";

interface SendArgs {
  userId: string;
  playerId: string;
  kind: NotificationKind;
  paymentId?: string;
  clubName?: string;
  sportName?: string;
  lang?: string;
}

/**
 * Fire-and-forget call to the server route that sends an event SMS.
 * Failures are logged to the console but never thrown — UI flows must not
 * be blocked by SMS issues.
 */
export async function sendEventSms(args: SendArgs): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    await fetch("/hooks/send-event-sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(args),
      keepalive: true,
    });
  } catch (e) {
    console.warn("[notifications] sendEventSms failed", e);
  }
}
