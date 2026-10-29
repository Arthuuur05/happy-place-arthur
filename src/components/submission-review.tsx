import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { CharCounter, rejectionErrorMessage } from "@/components/expandable-card";
import { ErrorSummary, Field, FormActions, Modal, TextArea } from "@/components/manage/crud-ui";
import { SubmissionReader } from "@/components/submission-reader";
import { REJECTION_CATEGORIES, reviewSubmission, type Submission } from "@/lib/dashboard";
import { rejectionSchema, validate, type FieldErrors } from "@/lib/manage-schemas";

/**
 * Lecture, validation et refus (motif + raison obligatoires) d'une demande.
 * Partagé par le dashboard et la page Demandes : le parent affiche `dialogs` une fois,
 * puis appelle `setReading`, `approve` ou `startReject` depuis ses propres boutons.
 */
export function useSubmissionReview(canReview: boolean): {
  reading: Submission | null;
  setReading: (s: Submission | null) => void;
  approve: (s: Submission) => void;
  startReject: (s: Submission) => void;
  isPending: boolean;
  dialogs: ReactNode;
} {
  const qc = useQueryClient();
  const [reading, setReading] = useState<Submission | null>(null);
  const [rejecting, setRejecting] = useState<Submission | null>(null);
  const [form, setForm] = useState({ rejection_category: "", rejection_note: "" });
  const [errors, setErrors] = useState<FieldErrors>({});

  const review = useMutation({
    mutationFn: reviewSubmission,
    onSuccess: (_d, vars) => {
      if (vars.status === "refusée") {
        setRejecting(null);
        toast.success("Soumission refusée");
      } else {
        setReading((r) => (r?.id === vars.id ? null : r));
        toast.success("Soumission validée");
      }
      void qc.invalidateQueries({ queryKey: ["submissions"] });
    },
    onError: (e: unknown) => toast.error(rejectionErrorMessage(e)),
  });

  const approve = (s: Submission) => review.mutate({ id: s.id, status: "validée" });

  function startReject(s: Submission) {
    setReading(null);
    setRejecting(s);
    setErrors({});
    setForm({ rejection_category: "", rejection_note: "" });
  }

  const reviewable = (s: Submission | null) => !!s && canReview && s.status === "en attente";

  const dialogs = (
    <>
      <SubmissionReader
        submission={reading}
        onClose={() => setReading(null)}
        onReject={reviewable(reading) ? () => reading && startReject(reading) : undefined}
        onApprove={reviewable(reading) ? () => reading && approve(reading) : undefined}
        approving={review.isPending}
      />
      {rejecting && (
        <Modal title="Refuser la soumission" onClose={() => setRejecting(null)}>
          <form
            noValidate
            className="space-y-sm"
            onSubmit={(e) => {
              e.preventDefault();
              const res = validate(rejectionSchema, form);
              if (!res.ok) return setErrors(res.errors);
              setErrors({});
              review.mutate({ id: rejecting.id, status: "refusée", ...res.data });
            }}
          >
            <p className="max-h-48 overflow-y-auto border border-outline-variant bg-surface-container-low p-xs text-body-sm italic text-on-surface-variant whitespace-pre-line wrap-anywhere">
              “{rejecting.content}”
            </p>
            <ErrorSummary errors={errors} />
            <Field label="Motif du refus" error={errors.rejection_category}>
              <select
                className="w-full border border-outline-variant bg-card p-xs text-body-sm"
                value={form.rejection_category}
                onChange={(e) => setForm({ ...form, rejection_category: e.target.value })}
              >
                <option value="">— Choisir un motif —</option>
                {REJECTION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Raison du refus (obligatoire)" error={errors.rejection_note}>
              <TextArea
                rows={4}
                value={form.rejection_note}
                placeholder="Explique au collaborateur pourquoi sa soumission est refusée…"
                onChange={(e) => setForm({ ...form, rejection_note: e.target.value })}
              />
              <CharCounter value={form.rejection_note} max={500} />
            </Field>
            <FormActions pending={review.isPending} onCancel={() => setRejecting(null)} />
          </form>
        </Modal>
      )}
    </>
  );

  return { reading, setReading, approve, startReject, isPending: review.isPending, dialogs };
}
