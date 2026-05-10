import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/paypal/config")({
  server: {
    handlers: {
      GET: async () => {
        const clientId = process.env.PAYPAL_CLIENT_ID || "";
        const env = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
        return Response.json({ clientId, env });
      },
    },
  },
});
