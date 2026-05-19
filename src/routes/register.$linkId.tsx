import { createFileRoute } from "@tanstack/react-router";
import { PublicPlayerRegistration } from "@/components/PublicPlayerRegistration";

export const Route = createFileRoute("/register/$linkId")({
  head: ({ params }) => ({
    meta: [
      { title: "Player Registration — My Club" },
      { name: "description", content: "Register as a player with your sports club through My Club's secure online registration form." },
      { property: "og:title", content: "Player Registration — My Club" },
      { property: "og:description", content: "Register as a player with your sports club through My Club's secure online registration form." },
      { property: "og:url", content: `https://my-club.live/register/${params.linkId}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { linkId } = Route.useParams();
  return <PublicPlayerRegistration linkId={linkId} />;
}
