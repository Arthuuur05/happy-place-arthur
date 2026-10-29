import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageError, PageLoading } from "@/components/page-states";
import { SubmissionPreview } from "@/components/expandable-card";
import { SubmissionReader } from "@/components/submission-reader";
import { ValidatedSubmissions } from "@/components/dashboard-extras";
import { supabase } from "@/integrations/supabase/client";
import { fetchMySubmissions, fetchSubmissions, timeAgo, type Submission } from "@/lib/dashboard";

export const Route = createFileRoute("/_authenticated/demandes")({
  head: () => ({ meta: [{ title: "Demandes — Happy Place" }] }),
  component: RequestsPage,
});

function SubmissionList({
  items,
  onRead,
  empty,
}: {
  items: Submission[];
  onRead: (s: Submission) => void;
  empty: string;
}) {
  if (items.length === 0)
    return <p className="text-body-sm text-on-surface-variant italic">{empty}</p>;
  return (
    <ul className="space-y-xs">
      {items.map((s) => (
        <li key={s.id} className="min-w-0 space-y-xs border border-outline-variant bg-card p-sm">
          <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">
            {s.author_name} • {s.team} • {s.status} • {timeAgo(s.created_at)}
          </p>
          <SubmissionPreview content={s.content} onOpen={() => onRead(s)} />
        </li>
      ))}
    </ul>
  );
}

function RequestsPage() {
  const { role, email } = Route.useRouteContext();
  const canReview = role === "admin" || role === "manager";
  const [reading, setReading] = useState<Submission | null>(null);

  const mine = useQuery({
    queryKey: ["submissions", "mine", email],
    queryFn: () => fetchMySubmissions(email),
    retry: false,
  });
  const pending = useQuery({
    queryKey: ["submissions"],
    queryFn: fetchSubmissions,
    enabled: canReview,
    retry: false,
  });
  const myTeams = useQuery({
    queryKey: ["manager_teams", "mine", email],
    enabled: role === "manager",
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manager_teams")
        .select("team, allowed_users!inner(email)")
        .eq("allowed_users.email", email.toLowerCase());
      if (error) throw error;
      return (data ?? []).map((t) => t.team).sort();
    },
  });

  if (mine.isLoading || (canReview && pending.isLoading)) return <PageLoading />;
  if (mine.isError || pending.isError || myTeams.isError) {
    return (
      <PageError
        onRetry={() => {
          void mine.refetch();
          if (canReview) void pending.refetch();
          if (role === "manager") void myTeams.refetch();
        }}
      />
    );
  }

  return (
    <main className="w-full max-w-interface mx-auto p-sm md:p-md space-y-md">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-sm">
        <div className="space-y-1">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
            Idées et demandes
          </p>
          <h1 className="font-headline-lg text-headline-lg text-primary">Demandes</h1>
        </div>
        <Link
          to="/"
          className="px-md py-xs border border-outline bg-surface text-primary font-label-md text-label-md hover:bg-surface-container"
        >
          SOUMETTRE UNE IDÉE DEPUIS LE DASHBOARD
        </Link>
      </div>

      {canReview && (
        <section className="min-w-0 space-y-sm border border-outline-variant bg-surface-container-lowest p-md">
          <h2 className="font-headline-sm text-headline-sm text-primary border-b border-outline-variant pb-sm">
            À traiter ({pending.data?.length ?? 0})
          </h2>
          <SubmissionList
            items={pending.data ?? []}
            onRead={setReading}
            empty="Aucune demande en attente de validation."
          />
          <p className="text-body-sm text-on-surface-variant">
            La validation et le refus se font depuis le{" "}
            <Link to="/" className="underline">
              dashboard
            </Link>
            .
          </p>
        </section>
      )}

      <section className="min-w-0 space-y-sm border border-outline-variant bg-surface-container-lowest p-md">
        <h2 className="font-headline-sm text-headline-sm text-primary border-b border-outline-variant pb-sm">
          Mes demandes
        </h2>
        <SubmissionList
          items={mine.data ?? []}
          onRead={setReading}
          empty="Vous n'avez soumis aucune demande."
        />
      </section>

      <div className="bento-grid">
        <ValidatedSubmissions
          role={role}
          email={email.toLowerCase()}
          managerTeams={myTeams.data ?? []}
          onRead={setReading}
        />
      </div>

      <SubmissionReader submission={reading} onClose={() => setReading(null)} />
    </main>
  );
}
