import { createFileRoute } from "@tanstack/react-router";
import { UsersAdmin } from "@/components/manage/users-admin";

export const Route = createFileRoute("/_authenticated/manage/users")({
  head: () => ({
    meta: [
      { title: "Utilisateurs autorisés — Happy Place" },
      { name: "description", content: "Liste blanche des comptes Google autorisés à se connecter." },
      { property: "og:title", content: "Utilisateurs autorisés — Happy Place" },
      { property: "og:description", content: "Gérer qui peut accéder à Happy Place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { email } = Route.useRouteContext();
  return <UsersAdmin me={email} view="users" />;
}
