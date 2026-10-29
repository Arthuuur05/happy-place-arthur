import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BlockerDetail } from "@/components/blocker-detail";
import { canReadAttachment } from "@/components/dashboard-extras";
import { PageError, PageLoading } from "@/components/page-states";
import { useSubmissionReview } from "@/components/submission-review";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllBlockers, fetchAllSubmissions, type Blocker } from "@/lib/dashboard";
import { shortDate } from "@/lib/dashboard-blocks";
import {
  buildRequestItems,
  filterByTab,
  KIND_LABELS,
  REQUEST_TABS,
  tabCounts,
  type RequestItem,
  type RequestTab,
} from "@/lib/requests-tabs";

export const Route = createFileRoute("/_authenticated/demandes")({
  head: () => ({ meta: [{ title: "Demandes — Happy Place" }] }),
  component: RequestsPage,
});

function RequestsPage() {
  const { role, email } = Route.useRouteContext();
  const canReview = role === "admin" || role === "manager";
  const { setReading, approve, startReject, isPending, dialogs } = useSubmissionReview(canReview);
  const [tab, setTab] = useState<RequestTab>("all");
  const [blocker, setBlocker] = useState<Blocker | null>(null);

  // La base ne renvoie que ce que le rôle a le droit de voir (RLS) : on n'ajoute aucun filtre ici.
  const blockers = useQuery({
    queryKey: ["blockers", "all"],
    queryFn: fetchAllBlockers,
    retry: false,
  });
  const submissions = useQuery({
    queryKey: ["submissions", "all"],
    queryFn: fetchAllSubmissions,
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

  if (blockers.isLoading || submissions.isLoading) return <PageLoading />;
  if (blockers.isError || submissions.isError || !blockers.data || !submissions.data) {
    return (
      <PageError
        message="Impossible de charger les demandes."
        onRetry={() => {
          void blockers.refetch();
          void submissions.refetch();
        }}
      />
    );
  }

  const items = buildRequestItems(blockers.data, submissions.data);
  const counts = tabCounts(items);
  const shown = filterByTab(items, tab);

  function open(item: RequestItem) {
    if (item.kind === "blocker") return setBlocker(item.blocker);
    const s = item.submission;
    // La pièce jointe n'est lisible que par l'auteur, le manager de l'équipe et l'admin.
    const ctx = { role, email, managerTeams: myTeams.data ?? [] };
    setReading(
      canReadAttachment(s, ctx) ? s : { ...s, attachment_path: null, attachment_name: null },
    );
  }

  return (
    <main className="w-full max-w-interface mx-auto p-sm md:p-md space-y-md">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-sm">
        <div className="space-y-1">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
            Idées, demandes et points bloquants
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

      <div
        role="tablist"
        aria-label="Type de demande"
        className="flex flex-wrap gap-xs border-b border-outline-variant pb-sm"
      >
        {REQUEST_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-md py-xs border font-label-md text-label-md ${
              tab === t.id
                ? "bg-primary text-on-primary border-primary"
                : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {t.label} ({counts[t.id]})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant italic">Rien pour le moment.</p>
      ) : (
        <ul role="tabpanel" className="space-y-xs">
          {shown.map((item) => {
            const reviewable =
              canReview && item.kind === "submission" && item.status === "en attente";
            return (
              <li
                key={`${item.kind}-${item.id}`}
                className="min-w-0 border border-outline-variant bg-surface-container-lowest"
              >
                <button
                  type="button"
                  onClick={() => open(item)}
                  aria-haspopup="dialog"
                  className="w-full min-w-0 space-y-1 p-sm text-left hover:bg-surface-container focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <p className="flex flex-wrap items-center gap-xs font-label-sm text-label-sm uppercase text-on-surface-variant">
                    <span className="border border-outline-variant px-xs">
                      {KIND_LABELS[item.kind]}
                    </span>
                    <span className="bg-surface-container-highest px-xs">{item.status}</span>
                    <span>{shortDate(item.date)}</span>
                  </p>
                  <p className="font-body-md text-primary font-bold wrap-anywhere">{item.title}</p>
                  <p className="font-label-sm text-label-sm uppercase text-on-surface-variant wrap-anywhere">
                    {item.owner}
                  </p>
                </button>
                {reviewable && item.kind === "submission" && (
                  <div className="flex gap-xs border-t border-outline-variant p-sm">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => startReject(item.submission)}
                      className="flex-1 py-1 border border-outline text-primary font-label-sm text-label-sm hover:bg-surface-container disabled:opacity-50"
                    >
                      REFUSER
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => approve(item.submission)}
                      className="flex-1 py-1 bg-primary text-on-primary font-label-sm text-label-sm hover:opacity-90 disabled:opacity-50"
                    >
                      VALIDER
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <BlockerDetail
        blocker={blocker}
        isAdmin={role === "admin"}
        onClose={() => setBlocker(null)}
      />
      {dialogs}
    </main>
  );
}
