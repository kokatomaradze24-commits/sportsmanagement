import { createFileRoute } from "@tanstack/react-router";
import { PublicPlayerRegistration } from "@/components/PublicPlayerRegistration";

export const Route = createFileRoute("/r/$code")({
  head: ({ params }) => ({
    meta: [
      { title: "Player Registration — My Club" },
      { name: "description", content: "Register as a player with your sports club through My Club's secure online registration form." },
      { property: "og:title", content: "Player Registration — My Club" },
      { property: "og:description", content: "Register as a player with your sports club through My Club's secure online registration form." },
      { property: "og:url", content: `https://my-club.live/r/${params.code}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { code } = Route.useParams();
  return <PublicPlayerRegistration linkId={code} />;
}
