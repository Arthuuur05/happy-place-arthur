import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ErrorSummary,
  Field,
  FormActions,
  Modal,
  Select,
  TextArea,
  TextInput,
} from "@/components/manage/crud-ui";
import { createBlocker, updateBlocker, type Blocker, type BlockerInput } from "@/lib/dashboard";
import { blockerSchema, validate, type FieldErrors } from "@/lib/manage-schemas";

const EMPTY: BlockerInput = {
  title: "",
  description: "",
  department: "",
  severity: "warning",
  status: "EN COURS",
};

/** Création (blocker = null) ou modification d'un point bloquant : outil de l'admin. */
export function BlockerEditModal({
  blocker,
  onClose,
}: {
  blocker: Blocker | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<BlockerInput>(() =>
    blocker
      ? {
          title: blocker.title,
          description: blocker.description ?? "",
          department: blocker.department,
          severity: blocker.severity,
          status: blocker.status,
        }
      : { ...EMPTY },
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  const save = useMutation({
    mutationFn: (input: BlockerInput) =>
      blocker ? updateBlocker(blocker.id, input) : createBlocker(input),
    onSuccess: () => {
      toast.success(blocker ? "Point bloquant modifié" : "Point bloquant créé");
      void qc.invalidateQueries({ queryKey: ["blockers"] });
      onClose();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = validate(blockerSchema, form);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    setErrors({});
    save.mutate(res.data);
  }

  return (
    <Modal
      title={blocker ? "Modifier le point bloquant" : "Nouveau point bloquant"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-sm" noValidate>
        <ErrorSummary errors={errors} />
        <Field label="Titre" error={errors.title}>
          <TextInput
            value={form.title}
            maxLength={160}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>
        <Field label="Description" error={errors.description}>
          <TextArea
            rows={4}
            value={form.description}
            maxLength={2000}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="Pôle concerné" error={errors.department}>
          <TextInput
            value={form.department}
            maxLength={60}
            placeholder="Ex. Data & IA"
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />
        </Field>
        <Field label="Sévérité" error={errors.severity}>
          <Select
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
          >
            <option value="critical">Critique</option>
            <option value="warning">Avertissement</option>
            <option value="info">Information</option>
          </Select>
        </Field>
        <Field label="Statut" error={errors.status}>
          <Select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="OUVERT">OUVERT</option>
            <option value="EN COURS">EN COURS</option>
            <option value="SURVEILLANCE">SURVEILLANCE</option>
            {blocker && (
              <option
                value="RÉSOLU"
                disabled={form.status === "OUVERT"}
                title={form.status === "OUVERT" ? "Passe d'abord par EN COURS" : undefined}
              >
                RÉSOLU
              </option>
            )}
          </Select>
        </Field>
        <FormActions pending={save.isPending} onCancel={onClose} />
      </form>
    </Modal>
  );
}
