import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { denyAccess } from "@/lib/access";
import { processAttachmentDeletionQueue } from "@/lib/dashboard";

export const Route = createFileRoute("/_authenticated/manage")({
  head: () => ({
    meta: [
      { title: "Gestion des données — Happy Place" },
      {
        name: "description",
        content:
          "Gérer les actualités du cabinet, les propositions internes, les alertes sur les recrutements et les indicateurs de performance.",
      },
      { property: "og:title", content: "Gestion des données — Happy Place" },
      {
        property: "og:description",
        content:
          "Gestion de l'activité d'un cabinet de recrutement spécialisé dans l'IT et le digital.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: ({ context }) => {
    if (context.role !== "admin") denyAccess();
  },
  component: ManageLayout,
});

// Chaque page de gestion s'ouvre depuis sa page d'origine : titre et retour propres à chacune, pas d'onglets.
type Section = {
  title: string;
  back: { to: "/" | "/actualites" | "/demandes" | "/equipes"; label: string };
};

const SECTIONS: Record<string, Section> = {
  "/manage/news": {
    title: "Gestion des actualités",
    back: { to: "/actualites", label: "← RETOUR AU FIL D'ACTUALITÉS" },
  },
  "/manage/submissions": {
    title: "Gestion des soumissions",
    back: { to: "/demandes", label: "← RETOUR AUX DEMANDES" },
  },
  "/manage/blockers": {
    title: "Gestion des points bloquants",
    back: { to: "/demandes", label: "← RETOUR AUX DEMANDES" },
  },
  "/manage/metrics": {
    title: "Gestion des indicateurs",
    back: { to: "/", label: "← RETOUR À LA VUE D'ENSEMBLE" },
  },
  "/manage/users": {
    title: "Utilisateurs autorisés",
    back: { to: "/equipes", label: "← RETOUR AUX ÉQUIPES" },
  },
};

const DEFAULT_SECTION: Section = {
  title: "Gestion des données",
  back: { to: "/", label: "← RETOUR À LA VUE D'ENSEMBLE" },
};

function ManageLayout() {
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const section = SECTIONS[pathname.replace(/\/$/, "")] ?? DEFAULT_SECTION;
  // Suppression silencieuse des pièces jointes échues, une fois par chargement de /manage
  useEffect(() => {
    processAttachmentDeletionQueue()
      .then((r) => {
        if (r.remaining > 0) toast.error(`${r.remaining} document(s) n'ont pas pu être supprimés.`);
        else if (r.deleted > 0) toast.success(`${r.deleted} document(s) supprimé(s)`);
      })
      .catch(() => toast.error("La suppression des documents échus a échoué."))
      .finally(() => qc.invalidateQueries({ queryKey: ["attachment_deletion_queue"] }));
  }, [qc]);
  return (
    <div className="bg-background text-on-surface font-body-md">
      <main className="w-full max-w-interface mx-auto p-sm md:p-md space-y-md">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-sm">
          <div className="space-y-1">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
              Gestion des données
            </p>
            <h1 className="font-headline-lg text-headline-lg text-primary">{section.title}</h1>
          </div>
          <Link
            to={section.back.to}
            className="px-md py-xs border border-outline bg-surface text-primary font-label-md text-label-md hover:bg-surface-container"
          >
            {section.back.label}
          </Link>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
