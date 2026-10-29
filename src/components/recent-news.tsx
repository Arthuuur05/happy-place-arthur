import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { NewsComposerModal } from "@/components/news-composer";
import { NewsReader } from "@/components/news-reader";
import { fetchNews, type News } from "@/lib/dashboard";
import { excerpt, mostRecent, shortDate } from "@/lib/dashboard-blocks";

/**
 * Bloc « Actualités récentes » : les 3 dernières actualités publiées.
 * Admin et managers peuvent en rédiger une (brouillon ou publication confirmée).
 */
export function RecentNewsBlock({ canWrite, email }: { canWrite: boolean; email: string }) {
  const q = useQuery({ queryKey: ["news"], queryFn: fetchNews, retry: false });
  const [reading, setReading] = useState<News | null>(null);
  const [composing, setComposing] = useState(false);
  const published = mostRecent((q.data ?? []).filter((n) => n.status === "publiée"));

  return (
    <section className="col-span-12 lg:col-span-7 min-w-0 bg-surface-container-lowest border border-outline-variant p-md flex flex-col gap-md">
      <div className="flex flex-wrap items-center justify-between gap-sm border-b border-outline-variant pb-sm">
        <h2 className="font-headline-sm text-headline-sm text-primary">Actualités récentes</h2>
        <div className="flex items-center gap-sm">
          <Link
            to="/actualites"
            className="font-label-sm text-label-sm uppercase text-primary underline-offset-2 hover:underline"
          >
            Voir tout
          </Link>
          {canWrite && (
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="flex items-center gap-xs px-md py-xs bg-primary text-on-primary font-label-md text-label-md hover:opacity-90"
            >
              <span aria-hidden="true" className="material-symbols-outlined">
                edit
              </span>{" "}
              Rédiger une actualité
            </button>
          )}
        </div>
      </div>

      {q.isLoading && <p className="text-body-sm text-on-surface-variant">Chargement…</p>}

      {q.isError && (
        <div role="alert" className="space-y-xs">
          <p className="text-body-sm text-error">Impossible de charger les actualités.</p>
          <button
            type="button"
            onClick={() => void q.refetch()}
            className="px-md py-xs border border-outline bg-surface text-primary font-label-md text-label-md hover:bg-surface-container"
          >
            Réessayer
          </button>
        </div>
      )}

      {q.data && published.length === 0 && (
        <p className="text-body-sm text-on-surface-variant italic">
          Aucune actualité publiée pour le moment.
        </p>
      )}

      {published.length > 0 && (
        <ul className="space-y-xs">
          {published.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => setReading(n)}
                aria-haspopup="dialog"
                className="w-full min-w-0 space-y-1 bg-surface-container p-sm text-left hover:bg-surface-container-high focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <p className="font-body-md text-primary font-bold wrap-anywhere">{n.title}</p>
                <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Publiée le {shortDate(n.created_at)} • Par {n.author}
                </p>
                {n.body && (
                  <p className="text-body-sm text-on-surface-variant wrap-anywhere">
                    {excerpt(n.body)}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <NewsReader news={reading} onClose={() => setReading(null)} />
      {composing && <NewsComposerModal authorEmail={email} onClose={() => setComposing(false)} />}
    </section>
  );
}
