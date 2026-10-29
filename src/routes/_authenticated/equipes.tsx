import { createFileRoute } from "@tanstack/react-router";
import { UsersAdmin } from "@/components/manage/users-admin";
import { TabBar } from "@/components/tab-bar";
import { denyAccess } from "@/lib/access";

type TeamsTab = "teams" | "users";

const TABS: readonly { id: TeamsTab; label: string }[] = [
  { id: "teams", label: "Équipes" },
  { id: "users", label: "Utilisateurs" },
];

export const Route = createFileRoute("/_authenticated/equipes")({
  head: () => ({ meta: [{ title: "Équipes — Happy Place" }] }),
  beforeLoad: ({ context }) => {
    if (context.role !== "admin") denyAccess();
  },
  // ?tab=users ouvre directement l'onglet Utilisateurs ; par défaut, Équipes
  validateSearch: (search: Record<string, unknown>): { tab?: TeamsTab } => ({
    tab: search.tab === "users" ? "users" : undefined,
  }),
  component: TeamsPage,
});

function TeamsPage() {
  const { email } = Route.useRouteContext();
  const navigate = Route.useNavigate();
  const tab = Route.useSearch().tab ?? "teams";
  return (
    <main className="w-full max-w-interface mx-auto p-sm md:p-md space-y-md">
      <div className="space-y-1">
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
          Organisation
        </p>
        <h1 className="font-headline-lg text-headline-lg text-primary">Équipes</h1>
      </div>
      <TabBar
        tabs={TABS}
        active={tab}
        label="Équipes et utilisateurs"
        onChange={(id) => void navigate({ search: { tab: id }, replace: true })}
      />
      <UsersAdmin key={tab} me={email} view={tab} />
    </main>
  );
}
