import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Field, Modal, TextArea, TextInput } from "@/components/manage/crud-ui";
import { NewsMediaEditor } from "@/components/news-media";
import { supabase } from "@/integrations/supabase/client";
import { publishDraftNews, saveDraftNews, updateNews, type News } from "@/lib/dashboard";
import {
  NEWS_PUBLISH_ERROR,
  NEWS_SAVE_ERROR,
  validateNewsDraft,
  type NewsDraftErrors,
} from "@/lib/dashboard-blocks";
import {
  emptyMedia,
  linkErrors,
  mediaFromNews,
  toNewsLinks,
  type MediaDraft,
} from "@/lib/news-media";

/** Nom affiché comme auteur : prénom + nom du compte, à défaut son adresse. */
async function fetchAuthorName(email: string): Promise<string> {
  const { data } = await supabase
    .from("allowed_users")
    .select("first_name, last_name")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return [data?.first_name, data?.last_name].filter(Boolean).join(" ") || email;
}

/**
 * Rédiger (ou terminer) une actualité : titre, texte, une image et jusqu'à 3 liens.
 * « Brouillon » enregistre ; « Publier » enregistre d'abord en brouillon puis demande confirmation.
 * Fermer la fenêtre sans enregistrer abandonne la saisie.
 * Une actualité déjà publiée (admin) se modifie sans changer de statut : un seul bouton « Enregistrer ».
 */
export function NewsComposerModal({
  draft,
  authorEmail,
  onClose,
}: {
  draft?: News | null;
  authorEmail: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isPublished = draft?.status === "publiée";
  const [title, setTitle] = useState(draft?.title ?? "");
  const [body, setBody] = useState(draft?.body ?? "");
  const [errors, setErrors] = useState<NewsDraftErrors>({});
  const [savedId, setSavedId] = useState<string | null>(draft?.id ?? null);
  const [confirming, setConfirming] = useState(false);
  const [media, setMedia] = useState<MediaDraft>(() =>
    draft ? mediaFromNews(draft) : emptyMedia(),
  );
  const [showLinkErrs, setShowLinkErrs] = useState(false);
  const linkErrs = showLinkErrs ? linkErrors(media.links) : {};

  const authorName = useQuery({
    queryKey: ["author-name", authorEmail],
    queryFn: () => fetchAuthorName(authorEmail),
    retry: false,
  });

  const save = useMutation({
    mutationFn: () => {
      // Une actualité existante garde son auteur.
      return saveDraftNews({
        id: savedId ?? undefined,
        title: title.trim(),
        body: body.trim(),
        author: draft?.author ?? authorName.data ?? authorEmail,
        author_email: draft?.author_email ?? authorEmail,
        links: toNewsLinks(media.links),
        media,
      });
    },
    onError: () => toast.error(NEWS_SAVE_ERROR),
  });

  const savePublished = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error("Actualité introuvable");
      return updateNews(
        draft.id,
        {
          title: title.trim(),
          body: body.trim(),
          author: draft.author,
          status: "publiée",
          links: toNewsLinks(media.links),
        },
        media,
      );
    },
    onSuccess: () => {
      toast.success("Actualité modifiée.");
      void qc.invalidateQueries({ queryKey: ["news"] });
      onClose();
    },
    onError: () => toast.error(NEWS_SAVE_ERROR),
  });

  const publish = useMutation({
    mutationFn: (id: string) => publishDraftNews(id),
    onSuccess: () => {
      toast.success("Actualité publiée.");
      void qc.invalidateQueries({ queryKey: ["news"] });
      onClose();
    },
    onError: () => {
      setConfirming(false);
      toast.error(NEWS_PUBLISH_ERROR);
    },
  });

  function validated() {
    const found = validateNewsDraft({ title, body });
    setErrors(found);
    setShowLinkErrs(true);
    if (Object.keys(linkErrors(media.links)).length) {
      toast.error("Corrige les liens invalides avant d'enregistrer.");
      return false;
    }
    return Object.keys(found).length === 0;
  }

  /** Après un enregistrement, l'image envoyée devient l'image existante (évite un second envoi). */
  async function syncSavedMedia(id: string) {
    const { data } = await supabase.from("news").select("image_path").eq("id", id).maybeSingle();
    setMedia((m) => ({
      ...m,
      file: null,
      removeExisting: false,
      existingPath: data?.image_path ?? null,
    }));
  }

  function saveChanges() {
    if (!validated()) return;
    savePublished.mutate();
  }

  function saveAsDraft() {
    if (!validated()) return;
    save.mutate(undefined, {
      onSuccess: () => {
        toast.success("Brouillon enregistré.");
        void qc.invalidateQueries({ queryKey: ["news"] });
        onClose();
      },
    });
  }

  function askToPublish() {
    if (!validated()) return;
    save.mutate(undefined, {
      onSuccess: async (id) => {
        setSavedId(id);
        await syncSavedMedia(id);
        void qc.invalidateQueries({ queryKey: ["news"] });
        setConfirming(true);
      },
    });
  }

  function cancelPublish() {
    setConfirming(false);
    toast.info("L'actualité reste en brouillon.");
  }

  const busy = save.isPending || publish.isPending || savePublished.isPending;

  return (
    <>
      <Modal title={draft ? "Modifier l'actualité" : "Rédiger une actualité"} onClose={onClose}>
        <form
          noValidate
          className="space-y-md"
          onSubmit={(e) => {
            e.preventDefault();
            if (isPublished) saveChanges();
            else saveAsDraft();
          }}
        >
          <Field label="Titre" error={errors.title}>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Saisis un titre…"
              aria-invalid={!!errors.title}
            />
          </Field>
          <Field label="Texte" error={errors.body}>
            <TextArea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Rédige l'actualité…"
              aria-invalid={!!errors.body}
            />
          </Field>
          <NewsMediaEditor
            value={media}
            onChange={setMedia}
            linkErrs={linkErrs}
            disabled={busy}
            title={title}
          />
          <div className="flex flex-wrap items-center justify-end gap-sm">
            {isPublished ? (
              <button
                type="submit"
                disabled={busy}
                className="px-lg py-xs bg-primary text-on-primary font-label-md text-label-md disabled:opacity-50"
              >
                {savePublished.isPending ? "Enregistrement…" : "Enregistrer"}
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-md py-xs border border-outline bg-surface text-primary font-label-md text-label-md hover:bg-surface-container disabled:opacity-50"
                >
                  {save.isPending && !confirming ? "Enregistrement…" : "Brouillon"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={askToPublish}
                  className="px-lg py-xs bg-primary text-on-primary font-label-md text-label-md disabled:opacity-50"
                >
                  Publier
                </button>
              </>
            )}
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={confirming}
        title="Publier cette actualité ?"
        description="Elle sera visible par tous."
        confirmLabel="Publier"
        busy={publish.isPending}
        onCancel={cancelPublish}
        onConfirm={() => savedId && publish.mutate(savedId)}
      />
    </>
  );
}
