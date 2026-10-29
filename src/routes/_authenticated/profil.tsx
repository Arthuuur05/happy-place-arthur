import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageError, PageLoading } from "@/components/page-states";
import { signOut, type AppRole } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({ meta: [{ title: "Profil — Happy Place" }] }),
  component: ProfilePage,
});

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  manager: "Manager",
  collaborateur: "Collaborateur",
};

async function fetchProfile(email: string, role: AppRole) {
  const { data, error } = await supabase
    .from("allowed_users")
    .select("id, first_name, last_name, team")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  let teams: string[] = [];
  if (role === "admin") teams = ["Admin"];
  else if (role === "collaborateur") teams = data?.team ? [data.team] : [];
  else if (data) {
    const res = await supabase.from("manager_teams").select("team").eq("allowed_user_id", data.id);
    if (res.error) throw res.error;
    teams = (res.data ?? []).map((t) => t.team).sort((a, b) => a.localeCompare(b, "fr"));
  }
  return { firstName: data?.first_name ?? "", lastName: data?.last_name ?? "", teams };
}

function ProfilePage() {
  const { email, role } = Route.useRouteContext();
  const profile = useQuery({
    queryKey: ["profile", email, role],
    queryFn: () => fetchProfile(email, role),
    retry: false,
  });

  if (profile.isLoading) return <PageLoading />;
  if (profile.isError || !profile.data) return <PageError onRetry={() => void profile.refetch()} />;

  const { firstName, lastName, teams } = profile.data;
  const rows: [string, string][] = [
    ["Nom", lastName || "—"],
    ["Prénom", firstName || "—"],
    ["Adresse mail", email],
    [teams.length > 1 ? "Équipes" : "Équipe", teams.length ? teams.join(", ") : "—"],
    ["Rôle", ROLE_LABELS[role]],
  ];

  return (
    <main className="w-full max-w-interface mx-auto p-sm md:p-md space-y-md">
      <div className="space-y-1">
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
          Compte
        </p>
        <h1 className="font-headline-lg text-headline-lg text-primary">Profil</h1>
      </div>
      <dl className="max-w-xl divide-y divide-outline-variant border border-outline-variant bg-surface-container-lowest">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 p-md sm:flex-row sm:gap-md">
            <dt className="font-label-sm text-label-sm uppercase text-on-surface-variant sm:w-40 sm:shrink-0">
              {label}
            </dt>
            <dd className="min-w-0 font-body-md text-body-md text-primary wrap-anywhere">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        onClick={() => signOut()}
        className="flex items-center gap-xs px-md py-xs border border-outline bg-surface text-primary font-label-md text-label-md hover:bg-surface-container"
      >
        <span aria-hidden="true" className="material-symbols-outlined">
          logout
        </span>{" "}
        DÉCONNEXION
      </button>
    </main>
  );
}
