import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CharCounter, rejectionErrorMessage } from "@/components/expandable-card";
import {
  ErrorSummary,
  Field,
  FormActions,
  Modal,
  TextArea,
  TextInput,
} from "@/components/manage/crud-ui";
import { supabase } from "@/integrations/supabase/client";
import { submitIdea, type SubmissionInput } from "@/lib/dashboard";
import { submissionSchema, validate, type FieldErrors } from "@/lib/manage-schemas";

/**
 * Soumettre une idée ou une demande (nom, texte, PDF facultatif).
 * L'équipe vient du compte : imposée pour un collaborateur, « Admin » pour l'admin,
 * choisie parmi ses équipes pour un manager.
 */
export function SubmitIdeaModal({
  role,
  email,
  onClose,
}: {
  role: string;
  email: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<SubmissionInput>({
    author_name: "",
    team: "",
    content: "",
    status: "en attente",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [attachment, setAttachment] = useState<File | null>(null);

  const myTeams = useQuery({
    queryKey: ["manager_teams", "mine", email],
    enabled: role === "manager" && !!email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manager_teams")
        .select("team, allowed_users!inner(email)")
        .eq("allowed_users.email", email.toLowerCase());
      if (error) throw error;
      return (data ?? []).map((t) => t.team).sort();
    },
  });
  // Un manager d'une seule équipe n'a rien à choisir.
  const onlyTeam = myTeams.data?.length === 1 ? myTeams.data[0] : "";
  const managerTeam = form.team || onlyTeam;

  const submit = useMutation({
    mutationFn: (input: SubmissionInput) =>
      submitIdea(
        { author_name: input.author_name, team: input.team, content: input.content },
        attachment,
      ),
    onSuccess: () => {
      toast.success("Soumission envoyée");
      void qc.invalidateQueries({ queryKey: ["submissions"] });
      onClose();
    },
    onError: (e: unknown) => toast.error(rejectionErrorMessage(e)),
  });

  function send(e: React.FormEvent) {
    e.preventDefault();
    // Collaborateur : équipe fixée côté base ; admin : toujours « Admin » ; manager : une de ses équipes
    const team = role === "collaborateur" ? "auto" : role === "admin" ? "Admin" : managerTeam;
    const result = validate(submissionSchema, { ...form, team, status: "en attente" });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    submit.mutate(result.data);
  }

  return (
    <Modal title="Soumettre une proposition" onClose={onClose}>
      <form onSubmit={send} className="space-y-sm" noValidate>
        <ErrorSummary errors={errors} />
        <Field label="Nom" error={errors.author_name}>
          <TextInput
            value={form.author_name}
            maxLength={80}
            placeholder="Ton nom"
            onChange={(e) => setForm({ ...form, author_name: e.target.value })}
          />
        </Field>
        {role === "manager" && (
          <Field label="Équipe" error={errors.team}>
            <select
              required
              value={managerTeam}
              onChange={(e) => setForm({ ...form, team: e.target.value })}
              className="w-full border border-outline-variant bg-surface px-sm py-xs font-body-md"
            >
              <option value="">Choisis une de tes équipes</option>
              {myTeams.data?.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        )}
        {role === "admin" && <p className="text-body-sm text-on-surface-variant">Équipe : Admin</p>}
        <Field label="Proposition" error={errors.content}>
          <TextArea
            rows={5}
            value={form.content}
            placeholder="Décris l'amélioration proposée pour le cabinet…"
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <CharCounter value={form.content} max={2000} min={5} />
        </Field>
        <Field label="Document PDF (optionnel, 20 Mo max)" error={errors.attachment}>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="block w-full text-body-sm"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f && f.type !== "application/pdf") {
                setErrors({ ...errors, attachment: "Seuls les fichiers PDF sont acceptés." });
                e.target.value = "";
                setAttachment(null);
                return;
              }
              if (f && f.size > 20 * 1024 * 1024) {
                setErrors({ ...errors, attachment: "Le fichier dépasse 20 Mo." });
                e.target.value = "";
                setAttachment(null);
                return;
              }
              const { attachment: _a, ...rest } = errors;
              setErrors(rest);
              setAttachment(f);
            }}
          />
        </Field>
        <FormActions pending={submit.isPending} submitLabel="ENVOYER" onCancel={onClose} />
      </form>
    </Modal>
  );
}
