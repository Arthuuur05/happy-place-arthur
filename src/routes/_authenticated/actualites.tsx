import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { NewsReader } from "@/components/news-reader";
import { PageError, PageLoading } from "@/components/page-states";
import { fetchNews, timeAgo, type News } from "@/lib/dashboard";

export const Route = createFileRoute("/_authenticated/actualites")({
  head: () => ({ meta: [{ title: "Fil d'actualités — Happy Place" }] }),
  component: NewsFeedPage,
});

function excerpt(body: string | null) {
  const text = (body ?? "").replace(/\s+/g, " ").trim();
  return text.length > 180 ? `${text.slice(0, 180).trimEnd()}…` : text;
}

function NewsFeedPage() {
  const { role } = Route.useRouteContext();
  const [reading, setReading] = useState<News | null>(null);
  const news = useQuery({ queryKey: ["news"], queryFn: fetchNews, retry: false });

  if (news.isLoading) return <PageLoading />;
  if (news.isError) return <PageError onRetry={() => void news.refetch()} />;

  const published = (news.data ?? []).filter((n) => n.status === "publiée");

  return (
    <main className="w-full max-w-interface mx-auto p-sm md:p-md space-y-md">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-sm">
        <div className="space-y-1">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
            Actualités
          </p>
          <h1 className="font-headline-lg text-headline-lg text-primary">Fil d'actualités</h1>
        </div>
        {role === "admin" && (
          <Link
            to="/manage/news"
            className="px-md py-xs border border-outline bg-surface text-primary font-label-md text-label-md hover:bg-surface-container"
          >
            GÉRER LES ACTUALITÉS
          </Link>
        )}
      </div>

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
                    {excerpt(n.body)}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      <NewsReader news={reading} onClose={() => setReading(null)} />
    </main>
  );
}
