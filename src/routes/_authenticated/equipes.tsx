import { createFileRoute } from "@tanstack/react-router";
import { UsersAdmin } from "@/components/manage/users-admin";
import { denyAccess } from "@/lib/access";

export const Route = createFileRoute("/_authenticated/equipes")({
  head: () => ({ meta: [{ title: "Équipes — Happy Place" }] }),
  beforeLoad: ({ context }) => {
    if (context.role !== "admin") denyAccess();
  },
  component: TeamsPage,
});

function TeamsPage() {
  const { email } = Route.useRouteContext();
  return (
    <main className="w-full max-w-interface mx-auto p-sm md:p-md space-y-md">
      <div className="space-y-1">
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
          Organisation
        </p>
        <h1 className="font-headline-lg text-headline-lg text-primary">Équipes</h1>
      </div>
      <UsersAdmin me={email} />
    </main>
  );
}
