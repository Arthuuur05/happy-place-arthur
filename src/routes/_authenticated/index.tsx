import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AttachmentLink } from "@/components/attachment-link";
import { SubmissionPreview } from "@/components/expandable-card";
import { Linkify } from "@/components/linkify";
import { useSubmissionReview } from "@/components/submission-review";
import { DepartureNotices } from "@/components/departure-notices";
import { PendingRequestsBlock } from "@/components/pending-requests";
import { RecentBlockersBlock } from "@/components/recent-blockers";
import { RecentNewsBlock } from "@/components/recent-news";
import { MetricsDialog } from "@/components/metrics-dialog";
import { Button } from "@/components/ui/button";
import {
  fetchMetrics,
  deltaText,
  fetchMySubmissions,
  exportMyRecentSubmissions,
  timeAgo,
  updateMetric,
  TREND_LABELS,
  type Metric,
} from "@/lib/dashboard";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Happy Place — Actualités et vue d'ensemble" },
      {
        name: "description",
        content:
          "Pilotez les missions de recrutement IT et digital, les propositions des équipes, les alertes opérationnelles et les indicateurs du cabinet.",
      },
      { property: "og:title", content: "Happy Place — Vue d'ensemble" },
      {
        property: "og:description",
        content:
          "Suivez l'activité du cabinet, les missions de recrutement, les alertes et les indicateurs clés.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagerSpace,
});

const PERF_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAz-Y4URSqOCzUaVC6vomdu54tTiFPC_bF9A_h0SjxJ1mq2OlNfOyeKTNkPIgtPRloYwE5JrWFm2FHBNUq0GScs0ALDVMiq16FLu95dHNGPjmybEoIb2uyz1OGozRn0XkudSMukcPY4gKfeOJMR_KAnhYbkZifswTCbpCs_aHZyMuoZRz_oc4KsWtWiryTdwVD0EKyvxScj3palbDIM2wMlnH0njPGj912mRwhMmTo3Yu07l6xfVv2Zuw";

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
      {name}
    </span>
  );
}

function trendText(m: Metric | undefined) {
  return m ? TREND_LABELS[m.trend] : "";
}

function metricOf(metrics: Metric[] | undefined, key: string) {
  return metrics?.find((m) => m.key === key);
}

function formatMetric(m: Metric | undefined, fallback: string) {
  if (!m) return fallback;
  const v = Number(m.value);
  const formatted = m.unit === "%" ? v.toFixed(1) : v.toLocaleString("fr-FR");
  return `${formatted}${m.unit ?? ""}`;
}

function metricLabel(metric: Metric | undefined, fallback: string) {
  if (!metric) return fallback;
  if (metric.key === "training_kpi") return "Taux de placement";
  if (metric.key === "active_users") return "Missions actives";
  return metric.label;
}

function ManagerSpace() {
  const qc = useQueryClient();
  const { role, email } = Route.useRouteContext();
  const isAdmin = role === "admin";
  const canReview = role === "admin" || role === "manager";
  const canWriteNews = canReview;
  const { setReading, dialogs: reviewDialogs } = useSubmissionReview(canReview);
  const myEmail = (email ?? "").toLowerCase();
  const [nps, setNps] = useState<string>("");
  const [metricsOpen, setMetricsOpen] = useState(false);

  const mine = useQuery({
    queryKey: ["submissions", "mine", email],
    queryFn: () => fetchMySubmissions(email ?? ""),
    enabled: !!email,
    retry: false,
  });
  const metrics = useQuery({ queryKey: ["metrics"], queryFn: fetchMetrics, retry: false });
  const onError = (e: unknown) => toast.error((e as Error).message);

  const exportReport = useMutation({
    mutationFn: () => {
      if (!email) throw new Error("Votre adresse e-mail est indisponible.");
      return exportMyRecentSubmissions(email);
    },
    onSuccess: (count) => {
      if (count === 0) {
        toast.info("Aucune soumission en attente ou validée sur les 30 derniers jours.");
        return;
      }
      toast.success(
        `${count} soumission${count > 1 ? "s" : ""} exportée${count > 1 ? "s" : ""} au format CSV.`,
      );
    },
    onError,
  });

  const saveMetric = useMutation({
    mutationFn: updateMetric,
    onSuccess: () => {
      toast.success("KPI mis à jour");
      qc.invalidateQueries({ queryKey: ["metrics"] });
    },
    onError,
  });

  const npsMetric = metricOf(metrics.data, "nps");
  const roleLabel = role === "admin" ? "ADMIN" : role === "manager" ? "MANAGER" : "COLLABORATEUR";

  return (
    <div className="bg-background text-on-surface font-body-md flex flex-col">
      <main className="flex-grow w-full max-w-interface mx-auto p-sm md:p-md space-y-md">
        {email && <DepartureNotices email={email} />}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-sm mb-lg">
          <div className="space-y-sm">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
              Vue d'ensemble
            </p>
            <h1 className="font-headline-lg text-headline-lg text-primary">Happy Place</h1>
          </div>
          <div className="flex flex-wrap gap-xs items-center md:items-end md:justify-end">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {email} · {roleLabel}
            </span>
          </div>
        </div>

        <div className="bento-grid">
          <RecentNewsBlock canWrite={canWriteNews} email={myEmail} />
          <PendingRequestsBlock onOpen={setReading} />
          <RecentBlockersBlock isAdmin={isAdmin} />

          {/* Performance Hub */}
          <section className="col-span-12 grid min-w-0 overflow-hidden bg-surface-container-lowest border border-outline-variant md:grid-cols-[2fr_3fr]">
            <div className="relative min-h-48 border-b border-outline-variant md:min-h-0 md:border-b-0 md:border-r">
              <img
                src={PERF_IMAGE}
                alt="Graphiques minimalistes à barres et à lignes dans un tableau de bord anthracite et blanc"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="flex min-w-0 flex-col p-md">
              <div className="flex items-center justify-between mb-md">
                <h2 className="font-headline-sm text-headline-sm text-primary">Indicateurs</h2>
                {isAdmin && (
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-label="Modifier les indicateurs"
                    title="Modifier les indicateurs"
                    onClick={() => setMetricsOpen(true)}
                    className="text-on-surface-variant hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Icon name="settings" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-sm mb-md">
                <div className="p-sm bg-card border border-outline-variant text-center">
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    {metricLabel(metricOf(metrics.data, "training_kpi"), "Taux de placement")}
                  </p>
                  <p className="font-display text-[32px] text-primary">
                    {formatMetric(metricOf(metrics.data, "training_kpi"), "—")}
                  </p>
                  <p className="text-[10px] text-on-surface-variant font-label-sm">
                    {trendText(metricOf(metrics.data, "training_kpi"))}
                    {deltaText(metricOf(metrics.data, "training_kpi")) &&
                      ` · ${deltaText(metricOf(metrics.data, "training_kpi"))}`}
                  </p>
                </div>
                <div className="p-sm bg-card border border-outline-variant text-center">
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    {metricLabel(metricOf(metrics.data, "active_users"), "Missions actives")}
                  </p>
                  <p className="font-display text-[32px] text-primary">
                    {formatMetric(metricOf(metrics.data, "active_users"), "—")}
                  </p>
                  <p className="text-[10px] text-on-surface-variant font-label-sm">
                    {trendText(metricOf(metrics.data, "active_users"))}
                    {deltaText(metricOf(metrics.data, "active_users")) &&
                      ` · ${deltaText(metricOf(metrics.data, "active_users"))}`}
                  </p>
                </div>
              </div>
              <div className="mb-md">
                <Button
                  type="button"
                  variant="outline"
                  disabled={exportReport.isPending}
                  onClick={() => exportReport.mutate()}
                  className="h-auto rounded-none border-outline bg-surface px-md py-xs font-label-md text-label-md text-primary shadow-none hover:bg-surface-container"
                >
                  <Icon name="file_download" />{" "}
                  {exportReport.isPending ? "EXPORT EN COURS…" : "EXPORTER LE RAPPORT"}
                </Button>
              </div>
              {isAdmin && (
                <div className="space-y-xs">
                  <label className="font-label-sm text-label-sm text-on-surface-variant block">
                    MODIFIER LE NPS CANDIDATS
                  </label>
                  <div className="flex gap-xs">
                    <input
                      className="flex-grow bg-card border border-outline-variant p-xs font-label-md focus:outline-none focus:border-primary"
                      type="number"
                      value={nps !== "" ? nps : (npsMetric?.value ?? "")}
                      onChange={(e) => setNps(e.target.value)}
                    />
                    <button
                      onClick={() =>
                        saveMetric.mutate({
                          key: "nps",
                          value: Number(nps !== "" ? nps : (npsMetric?.value ?? 0)),
                        })
                      }
                      disabled={saveMetric.isPending}
                      className="bg-primary text-on-primary px-sm font-label-md text-label-md disabled:opacity-50"
                    >
                      METTRE À JOUR
                    </button>
                  </div>
                  <p className="text-[10px] text-on-surface-variant italic">
                    {npsMetric
                      ? `Tendance : ${trendText(npsMetric)}${
                          deltaText(npsMetric) ? ` · ${deltaText(npsMetric)}` : ""
                        }`
                      : "Mis à jour à partir des retours candidats."}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Mes soumissions */}
          {mine.data && mine.data.length > 0 && (
            <section className="col-span-12 min-w-0 bg-surface-container-lowest border border-outline-variant p-md">
              <h2 className="font-headline-sm text-headline-sm text-primary border-b border-outline-variant pb-sm mb-md">
                Mes soumissions
              </h2>
              <div className="space-y-xs">
                {mine.data.map((s) => (
                  <div
                    key={s.id}
                    className="p-sm border border-outline-variant bg-card min-w-0 overflow-hidden"
                  >
                    <SubmissionPreview content={s.content} onOpen={() => setReading(s)} />
                    <AttachmentLink path={s.attachment_path} name={s.attachment_name} />
                    <p className="text-[11px] font-label-sm text-on-surface-variant uppercase mt-xs">
                      {s.status} • {s.team} • {timeAgo(s.created_at)}
                    </p>
                    {s.status === "refusée" && s.rejection_category && (
                      <div className="mt-xs p-xs bg-error-container text-on-error-container text-body-sm wrap-anywhere">
                        <p className="font-bold">Motif : {s.rejection_category}</p>
                        <p className="whitespace-pre-line">
                          Raison : <Linkify text={s.rejection_note ?? ""} />
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      {reviewDialogs}
      {isAdmin && <MetricsDialog open={metricsOpen} onClose={() => setMetricsOpen(false)} />}
    </div>
  );
}
