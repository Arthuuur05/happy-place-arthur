import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageError, PageLoading } from "@/components/page-states";
import { supabase } from "@/integrations/supabase/client";
import { denyAccess } from "@/lib/access";

export const Route = createFileRoute("/_authenticated/equipes")({
  head: () => ({ meta: [{ title: "Équipes — Happy Place" }] }),
  beforeLoad: ({ context }) => {
    if (context.role !== "admin") denyAccess();
  },
  component: TeamsPage,
});

type Member = { name: string; role: string; teams: string[] };

async function fetchTeamsOverview() {
  const [teams, users] = await Promise.all([
    supabase.from("teams").select("name, is_reserved").order("name"),
    supabase
      .from("allowed_users")
      .select("email, first_name, last_name, team, allowed_user_roles(role), manager_teams(team)"),
  ]);
  if (teams.error) throw teams.error;
  if (users.error) throw users.error;
  const members: Member[] = (users.data ?? []).map((u) => {
    // allowed_user_roles est une relation 1-1 : PostgREST renvoie un objet, pas un tableau
    const roleRow = Array.isArray(u.allowed_user_roles)
      ? u.allowed_user_roles[0]
      : u.allowed_user_roles;
    const role = roleRow?.role ?? "collaborateur";
    const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email;
    const memberTeams =
      role === "admin"
        ? ["Admin"]
        : role === "manager"
          ? u.manager_teams.map((t) => t.team)
          : u.team
            ? [u.team]
            : [];
    return { name, role, teams: memberTeams };
  });
  return { teams: teams.data ?? [], members };
}

function TeamsPage() {
  const overview = useQuery({
    queryKey: ["teams", "overview"],
    queryFn: fetchTeamsOverview,
    retry: false,
  });

  if (overview.isLoading) return <PageLoading />;
  if (overview.isError || !overview.data)
    return <PageError onRetry={() => void overview.refetch()} />;

  const { teams, members } = overview.data;

  return (
    <main className="w-full max-w-interface mx-auto p-sm md:p-md space-y-md">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-sm">
        <div className="space-y-1">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
            Organisation
          </p>
          <h1 className="font-headline-lg text-headline-lg text-primary">Équipes</h1>
        </div>
        <Link
          to="/manage/users"
          className="px-md py-xs border border-outline bg-surface text-primary font-label-md text-label-md hover:bg-surface-container"
        >
          MODIFIER LES ÉQUIPES
        </Link>
      </div>

      {teams.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant italic">Aucune équipe pour le moment.</p>
      ) : (
        <div className="grid gap-xs md:grid-cols-2 xl:grid-cols-3">
          {teams.map((t) => {
            const inTeam = members.filter((m) => m.teams.includes(t.name));
            const managers = inTeam.filter((m) => m.role === "manager");
            return (
              <section
                key={t.name}
                className="min-w-0 space-y-xs border border-outline-variant bg-surface-container-lowest p-md"
              >
                <h2 className="font-headline-sm text-headline-sm text-primary wrap-anywhere">
                  {t.name}
                </h2>
                <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                  {inTeam.length} membre{inTeam.length > 1 ? "s" : ""}
                </p>
                <p className="text-body-sm text-on-surface-variant wrap-anywhere">
                  {managers.length
                    ? `Manager : ${managers.map((m) => m.name).join(", ")}`
                    : "Aucun manager"}
                </p>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
