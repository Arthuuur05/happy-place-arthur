import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CharCounter, rejectionErrorMessage } from "@/components/expandable-card";
import {
  ErrorSummary,
  Field,
  FormActions,
  Modal,
  Select,
  TextArea,
  TextInput,
} from "@/components/manage/crud-ui";
import {
  REJECTION_CATEGORIES,
  createSubmission,
  updateSubmission,
  type Submission,
  type SubmissionInput,
} from "@/lib/dashboard";
import { submissionSchema, validate, type FieldErrors } from "@/lib/manage-schemas";

const EMPTY: SubmissionInput = { author_name: "", team: "", content: "", status: "en attente" };

/** Création (submission = null) ou modification d'une soumission, tous statuts : outil de l'admin. */
export function SubmissionEditModal({
  submission,
  onClose,
}: {
  submission: Submission | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<SubmissionInput>(() =>
    submission
      ? {
          author_name: submission.author_name,
          team: submission.team,
          content: submission.content,
          status: submission.status,
          rejection_category: submission.rejection_category ?? "",
          rejection_note: submission.rejection_note ?? "",
        }
      : { ...EMPTY },
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  const save = useMutation({
    mutationFn: (input: SubmissionInput) =>
      submission ? updateSubmission(submission.id, input) : createSubmission(input),
    onSuccess: () => {
      toast.success(submission ? "Soumission modifiée" : "Soumission créée");
      void qc.invalidateQueries({ queryKey: ["submissions"] });
      onClose();
    },
    onError: (e: unknown) => toast.error(rejectionErrorMessage(e)),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = validate(submissionSchema, form);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    setErrors({});
    save.mutate(res.data);
  }

  return (
    <Modal title={submission ? "Modifier la soumission" : "Nouvelle soumission"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-sm" noValidate>
        <ErrorSummary errors={errors} />
        <Field label="Auteur" error={errors.author_name}>
          <TextInput
            value={form.author_name}
            maxLength={80}
            onChange={(e) => setForm({ ...form, author_name: e.target.value })}
          />
        </Field>
        <Field label="Pôle" error={errors.team}>
          <TextInput
            value={form.team}
            maxLength={60}
            placeholder="Ex. Product team, Cloud & DevOps…"
            onChange={(e) => setForm({ ...form, team: e.target.value })}
          />
        </Field>
        <Field label="Contenu" error={errors.content}>
          <TextArea
            rows={4}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <CharCounter value={form.content} max={2000} min={5} />
        </Field>
        <Field label="Statut" error={errors.status}>
          <Select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="en attente">En attente</option>
            <option value="validée">Validée</option>
            <option value="refusée">Refusée</option>
          </Select>
        </Field>
        {form.status === "refusée" && (
          <>
            <Field label="Motif du refus" error={errors.rejection_category}>
              <Select
                value={form.rejection_category ?? ""}
                onChange={(e) => setForm({ ...form, rejection_category: e.target.value })}
              >
                <option value="">— Choisir un motif —</option>
                {REJECTION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Raison du refus (obligatoire)" error={errors.rejection_note}>
              <TextArea
                rows={4}
                value={form.rejection_note ?? ""}
                onChange={(e) => setForm({ ...form, rejection_note: e.target.value })}
              />
              <CharCounter value={form.rejection_note ?? ""} max={500} />
            </Field>
          </>
        )}
        <FormActions pending={save.isPending} onCancel={onClose} />
      </form>
    </Modal>
  );
}
