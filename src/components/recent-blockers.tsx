import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BlockerDetail } from "@/components/blocker-detail";
import { fetchBlockers, type Blocker } from "@/lib/dashboard";
import { DASHBOARD_BLOCK_SIZE, shortDate } from "@/lib/dashboard-blocks";

/**
 * Bloc « Points bloquants récents » : les 3 derniers points bloquants non résolus
 * (le total reste dans « (n) »). Le clic ouvre le détail, où l'admin change le statut.
 */
export function RecentBlockersBlock({ isAdmin }: { isAdmin: boolean }) {
  // fetchBlockers renvoie les points non résolus, du plus récemment mis à jour au plus ancien.
  const q = useQuery({ queryKey: ["blockers"], queryFn: fetchBlockers, retry: false });
  const [reading, setReading] = useState<Blocker | null>(null);
  const total = q.data?.length ?? 0;

  return (
    <section className="col-span-12 lg:col-span-6 min-w-0 bg-surface-container-lowest border border-outline-variant p-md flex flex-col gap-md">
      <div className="flex items-center justify-between gap-sm border-b border-outline-variant pb-sm">
        <h2 className="font-headline-sm text-headline-sm text-primary">
          Points bloquants récents{q.data ? ` (${total})` : ""}
        </h2>
        <Link
          to="/demandes"
          search={{ tab: "blockers" }}
          className="font-label-sm text-label-sm uppercase text-primary underline-offset-2 hover:underline"
        >
          Voir tout
        </Link>
      </div>

      {q.isLoading && (
        <ul className="space-y-xs" aria-busy="true">
          {Array.from({ length: DASHBOARD_BLOCK_SIZE }, (_, i) => (
            <li key={i} className="bg-surface-container p-sm text-body-sm text-on-surface-variant">
              Chargement…
            </li>
          ))}
        </ul>
      )}

      {q.isError && (
        <div role="alert" className="space-y-xs">
          <p className="text-body-sm text-error">Impossible de charger les points bloquants.</p>
          <button
            type="button"
            onClick={() => void q.refetch()}
            className="px-md py-xs border border-outline bg-surface text-primary font-label-md text-label-md hover:bg-surface-container"
          >
            Réessayer
          </button>
        </div>
      )}

      {q.data && total === 0 && (
        <p className="text-body-sm text-on-surface-variant italic">
          Aucun point bloquant en cours.
        </p>
      )}

      {q.data && total > 0 && (
        <ul className="space-y-xs">
          {q.data.slice(0, DASHBOARD_BLOCK_SIZE).map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => setReading(b)}
                aria-haspopup="dialog"
                className="w-full min-w-0 space-y-1 bg-surface-container p-sm text-left hover:bg-surface-container-high focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <p className="font-body-md text-primary font-bold wrap-anywhere">{b.title}</p>
                <p className="font-label-sm text-label-sm uppercase text-on-surface-variant wrap-anywhere">
                  {b.department} • {b.status} • {shortDate(b.updated_at)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <BlockerDetail blocker={reading} isAdmin={isAdmin} onClose={() => setReading(null)} />
    </section>
  );
}
