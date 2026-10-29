import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchSubmissions, isSubmissionPending, type Submission } from "@/lib/dashboard";
import { DASHBOARD_BLOCK_SIZE, mostRecent, requestTitle, shortDate } from "@/lib/dashboard-blocks";

/**
 * Bloc « Soumissions en attente (n) » : les 3 plus récentes parmi celles que l'utilisateur peut voir
 * (la base filtre déjà par rôle et par équipe). Le clic ouvre le détail, où l'on valide ou refuse.
 */
export function PendingRequestsBlock({ onOpen }: { onOpen: (s: Submission) => void }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["submissions"], queryFn: fetchSubmissions, retry: false });
  const total = q.data?.length ?? 0;

  async function open(s: Submission) {
    try {
      if (!(await isSubmissionPending(s.id))) {
        toast.info("Cette demande a déjà été traitée.");
        void qc.invalidateQueries({ queryKey: ["submissions"] });
        return;
      }
    } catch {
      // Vérification impossible : on ouvre quand même, la base refusera une décision invalide.
    }
    onOpen(s);
  }

  return (
    <section className="col-span-12 lg:col-span-6 min-w-0 bg-surface-container-lowest border border-outline-variant p-md flex flex-col gap-md">
      <div className="flex items-center justify-between gap-sm border-b border-outline-variant pb-sm">
        <h2 className="font-headline-sm text-headline-sm text-primary">
          Soumissions en attente{q.data ? ` (${total})` : ""}
        </h2>
        <Link
          to="/demandes"
          search={{ tab: "submissions" }}
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
          <p className="text-body-sm text-error">Impossible de charger les demandes.</p>
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
          Aucune soumission en attente. Tout est à jour.
        </p>
      )}

      {q.data && total > 0 && (
        <ul className="space-y-xs">
          {mostRecent(q.data).map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => void open(s)}
                aria-haspopup="dialog"
                className="w-full min-w-0 space-y-1 bg-surface-container p-sm text-left hover:bg-surface-container-high focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <p className="font-body-md text-primary font-bold wrap-anywhere">
                  {requestTitle(s.content)}
                </p>
                <p className="font-label-sm text-label-sm uppercase text-on-surface-variant wrap-anywhere">
                  {s.author_name} • {s.team} • {shortDate(s.created_at)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
