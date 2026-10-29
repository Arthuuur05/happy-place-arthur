import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BlockerEditModal } from "@/components/manage/blocker-edit-modal";
import { ConfirmDelete, RowActions } from "@/components/manage/crud-ui";
import { SubmissionEditModal } from "@/components/manage/submission-edit-modal";
import { deleteBlocker, deleteSubmission, type Blocker, type Submission } from "@/lib/dashboard";

/** Modifier / Supprimer une soumission (admin), avec confirmation de suppression. */
export function SubmissionAdminActions({ submission }: { submission: Submission }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const remove = useMutation({
    mutationFn: () => deleteSubmission(submission.id),
    onSuccess: () => {
      toast.success("Soumission supprimée");
      setConfirming(false);
      void qc.invalidateQueries({ queryKey: ["submissions"] });
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
  return (
    <>
      <RowActions onEdit={() => setEditing(true)} onDelete={() => setConfirming(true)} />
      {editing && <SubmissionEditModal submission={submission} onClose={() => setEditing(false)} />}
      {confirming && (
        <ConfirmDelete
          label={submission.author_name}
          pending={remove.isPending}
          onCancel={() => setConfirming(false)}
          onConfirm={() => remove.mutate()}
        />
      )}
    </>
  );
}

/** Modifier / Supprimer un point bloquant (admin), avec confirmation de suppression. */
export function BlockerAdminActions({ blocker }: { blocker: Blocker }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const remove = useMutation({
    mutationFn: () => deleteBlocker(blocker.id),
    onSuccess: () => {
      toast.success("Point bloquant supprimé");
      setConfirming(false);
      void qc.invalidateQueries({ queryKey: ["blockers"] });
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
  return (
    <>
      <RowActions onEdit={() => setEditing(true)} onDelete={() => setConfirming(true)} />
      {editing && <BlockerEditModal blocker={blocker} onClose={() => setEditing(false)} />}
      {confirming && (
        <ConfirmDelete
          label={blocker.title}
          pending={remove.isPending}
          onCancel={() => setConfirming(false)}
          onConfirm={() => remove.mutate()}
        />
      )}
    </>
  );
}
