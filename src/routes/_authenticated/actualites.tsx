import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { NewsComposerModal } from "@/components/news-composer";
import { NewsReader } from "@/components/news-reader";
import { PageError, PageLoading } from "@/components/page-states";
import { deleteDraftNews, fetchNews, publishDraftNews, timeAgo, type News } from "@/lib/dashboard";
import { excerpt, NEWS_PUBLISH_ERROR } from "@/lib/dashboard-blocks";

export const Route = createFileRoute("/_authenticated/actualites")({
  head: () => ({ meta: [{ title: "Fil d'actualités — Happy Place" }] }),
  component: NewsFeedPage,
});

type Pending = { kind: "publish" | "delete"; news: News };

function NewsFeedPage() {
  const qc = useQueryClient();
  const { role, email } = Route.useRouteContext();
  const isAdmin = role === "admin";
  const canWrite = isAdmin || role === "manager";
  const myEmail = email.toLowerCase();
  const [reading, setReading] = useState<News | null>(null);
  const [composing, setComposing] = useState<{ draft: News | null } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const news = useQuery({ queryKey: ["news"], queryFn: fetchNews, retry: false });

  const publish = useMutation({
    mutationFn: (n: News) => publishDraftNews(n.id),
    onSuccess: () => {
      toast.success("Actualité publiée.");
      void qc.invalidateQueries({ queryKey: ["news"] });
    },
    onError: () => toast.error(NEWS_PUBLISH_ERROR),
    onSettled: () => setPending(null),
  });

  const remove = useMutation({
    mutationFn: (n: News) => deleteDraftNews(n.id, n.image_path),
    onSuccess: () => {
      toast.success("Brouillon supprimé.");
      void qc.invalidateQueries({ queryKey: ["news"] });
    },
    onError: () => toast.error("Le brouillon n'a pas pu être supprimé. Réessayez."),
    onSettled: () => setPending(null),
  });

  if (news.isLoading) return <PageLoading />;
  if (news.isError) return <PageError onRetry={() => void news.refetch()} />;

  const all = news.data ?? [];
  const published = all.filter((n) => n.status === "publiée");
  // La base ne renvoie à un manager que ses propres brouillons ; l'admin voit tous les brouillons.
  const drafts = canWrite ? all.filter((n) => n.status === "brouillon") : [];

  return (
    <main className="w-full max-w-interface mx-auto p-sm md:p-md space-y-md">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-sm">
        <div className="space-y-1">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
            Actualités
          </p>
          <h1 className="font-headline-lg text-headline-lg text-primary">Fil d'actualités</h1>
        </div>
        <div className="flex flex-wrap items-center gap-xs">
          {canWrite && (
            <button
              type="button"
              onClick={() => setComposing({ draft: null })}
              className="px-md py-xs bg-primary text-on-primary font-label-md text-label-md hover:opacity-90"
            >
              RÉDIGER UNE ACTUALITÉ
            </button>
          )}
          {isAdmin && (
            <Link
              to="/manage/news"
              className="px-md py-xs border border-outline bg-surface text-primary font-label-md text-label-md hover:bg-surface-container"
            >
              GÉRER LES ACTUALITÉS
            </Link>
          )}
        </div>
      </div>

      {canWrite && drafts.length > 0 && (
        <section className="space-y-sm">
          <h2 className="font-headline-sm text-headline-sm text-primary">Brouillons</h2>
          <ul className="space-y-xs">
            {drafts.map((n) => {
              const allowed = isAdmin || (n.author_email ?? "").toLowerCase() === myEmail;
              return (
                <li
                  key={n.id}
                  className="flex flex-col gap-sm border border-outline-variant bg-surface-container-lowest p-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-body-md text-primary flex flex-wrap items-center gap-xs">
                      <span className="wrap-anywhere font-bold">{n.title}</span>
                      <span className="shrink-0 border border-outline-variant px-xs font-label-sm text-label-sm text-on-surface-variant">
                        Brouillon
                      </span>
                    </p>
                    <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                      Créé {timeAgo(n.created_at)} • Par {n.author}
                    </p>
                  </div>
                  {allowed && (
                    <div className="flex shrink-0 items-center gap-sm">
                      <button
                        type="button"
                        className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary"
                        onClick={() => setComposing({ draft: n })}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="font-label-sm text-label-sm text-error"
                        onClick={() => setPending({ kind: "delete", news: n })}
                      >
                        Supprimer
                      </button>
                      <button
                        type="button"
                        className="px-sm py-1 bg-primary text-on-primary font-label-sm text-label-sm"
                        onClick={() => setPending({ kind: "publish", news: n })}
                      >
                        Publier
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="space-y-sm">
        {canWrite && drafts.length > 0 && (
          <h2 className="font-headline-sm text-headline-sm text-primary">Publiées</h2>
        )}
        {published.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant italic">
            Aucune actualité publiée pour le moment.
          </p>
        ) : (
          <ul className="space-y-xs">
            {published.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => setReading(n)}
                  className="w-full min-w-0 space-y-xs border border-outline-variant bg-surface-container-lowest p-md text-left hover:bg-surface-container"
                >
                  <p className="font-headline-sm text-headline-sm text-primary wrap-anywhere">
                    {n.title}
                  </p>
                  <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                    Publiée {timeAgo(n.created_at)} • Par {n.author}
                  </p>
                  {n.body && (
                    <p className="text-body-sm text-on-surface-variant wrap-anywhere">
                      {excerpt(n.body, 180)}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <NewsReader news={reading} onClose={() => setReading(null)} />
      {composing && (
        <NewsComposerModal
          key={composing.draft?.id ?? "new"}
          draft={composing.draft}
          authorEmail={myEmail}
          onClose={() => setComposing(null)}
        />
      )}
      <ConfirmDialog
        open={pending?.kind === "publish"}
        title="Publier cette actualité ?"
        description="Elle sera visible par tous."
        confirmLabel="Publier"
        busy={publish.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && publish.mutate(pending.news)}
      />
      <ConfirmDialog
        open={pending?.kind === "delete"}
        title="Supprimer ce brouillon ?"
        description={
          pending ? `« ${pending.news.title} » sera supprimé définitivement.` : undefined
        }
        confirmLabel="Supprimer"
        busy={remove.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && remove.mutate(pending.news)}
      />
    </main>
  );
}
