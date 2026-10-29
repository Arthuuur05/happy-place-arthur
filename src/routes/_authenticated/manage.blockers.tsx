import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BlockerEditModal } from "@/components/manage/blocker-edit-modal";
import { ConfirmDelete, RowActions } from "@/components/manage/crud-ui";
import { deleteBlocker, fetchAllBlockers, timeAgo, type Blocker } from "@/lib/dashboard";

export const Route = createFileRoute("/_authenticated/manage/blockers")({
  head: () => ({
    meta: [
      { title: "Gestion des points bloquants — Happy Place" },
      { name: "description", content: "Créez, modifiez et supprimez les points bloquants dans Happy Place." },
      { property: "og:title", content: "Gestion des points bloquants — Happy Place" },
      { property: "og:description", content: "Gérez les alertes opérationnelles des missions de recrutement dans Happy Place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ManageBlockers,
});

const severityLabels: Record<string, string> = {
  critical: "Critique",
  warning: "Avertissement",
  info: "Information",
};

function ManageBlockers() {
  const qc = useQueryClient();
  // modal : null = fermée ; blocker null = création, sinon modification
  const [modal, setModal] = useState<{ blocker: Blocker | null } | null>(null);
  const [toDelete, setToDelete] = useState<Blocker | null>(null);

  const list = useQuery({ queryKey: ["blockers", "all"], queryFn: fetchAllBlockers, retry: false });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["blockers"] });
  const onError = (e: unknown) => toast.error((e as Error).message);

  const remove = useMutation({
    mutationFn: (id: string) => deleteBlocker(id),
    onSuccess: () => {
      toast.success("Point bloquant supprimé");
      setToDelete(null);
      invalidate();
    },
    onError,
  });

  return (
    <section className="space-y-md">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-sm text-headline-sm text-primary">
          Points bloquants ({list.data?.length ?? 0})
        </h2>
        <button
          onClick={() => setModal({ blocker: null })}
          className="px-md py-xs bg-primary text-on-primary font-label-md text-label-md"
        >
          + NOUVEAU POINT BLOQUANT
        </button>
      </div>

      {list.isLoading && <p className="text-body-sm text-on-surface-variant">Chargement…</p>}
      {list.isError && (
        <p className="text-body-sm text-error">Impossible de charger les points bloquants.</p>
      )}

      <div className="space-y-xs">
        {list.data?.map((b) => (
          <article
            key={b.id}
            className="flex items-start justify-between gap-sm p-sm bg-card border border-outline-variant"
          >
            <div>
              <p className="font-body-md text-primary font-bold">{b.title}</p>
              <p className="text-body-sm text-on-surface-variant">{b.description}</p>
              <p className="text-[11px] font-label-sm text-on-surface-variant uppercase mt-xs">
                 {b.department} • {severityLabels[b.severity] ?? b.severity} • {b.status} • {timeAgo(b.updated_at)}
              </p>
            </div>
            <RowActions
              onEdit={() => setModal({ blocker: b })}
              onDelete={() => setToDelete(b)}
            />
          </article>
        ))}
        {list.data?.length === 0 && (
          <p className="text-body-sm italic text-on-surface-variant">Aucun point bloquant.</p>
        )}
      </div>

      {modal && <BlockerEditModal blocker={modal.blocker} onClose={() => setModal(null)} />}

      {toDelete && (
        <ConfirmDelete
          label={toDelete.title}
          pending={remove.isPending}
          onCancel={() => setToDelete(null)}
          onConfirm={() => remove.mutate(toDelete.id)}
        />
      )}
    </section>
  );
}
