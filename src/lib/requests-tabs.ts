import type { Blocker, Submission } from "@/lib/dashboard";
import { requestTitle } from "@/lib/dashboard-blocks";

/** Page Demandes : points bloquants et soumissions réunis, chacun gardant ses statuts d'origine. */

export type RequestTab = "all" | "blockers" | "submissions";

export const REQUEST_TABS: readonly { id: RequestTab; label: string }[] = [
  { id: "all", label: "Toutes les demandes" },
  { id: "blockers", label: "Points bloquants" },
  { id: "submissions", label: "Soumissions" },
];

export type RequestItem =
  | {
      kind: "blocker";
      id: string;
      title: string;
      owner: string;
      status: string;
      date: string;
      blocker: Blocker;
    }
  | {
      kind: "submission";
      id: string;
      title: string;
      owner: string;
      status: string;
      date: string;
      submission: Submission;
    };

export const KIND_LABELS: Record<RequestItem["kind"], string> = {
  blocker: "Point bloquant",
  submission: "Soumission",
};

/** Éléments réunis, du plus récent au plus ancien. Les statuts ne sont jamais modifiés ni fusionnés. */
export function buildRequestItems(
  blockers: readonly Blocker[],
  submissions: readonly Submission[],
): RequestItem[] {
  const items: RequestItem[] = [
    ...blockers.map((b) => ({
      kind: "blocker" as const,
      id: b.id,
      title: b.title,
      owner: b.department,
      status: b.status,
      date: b.updated_at,
      blocker: b,
    })),
    ...submissions.map((s) => ({
      kind: "submission" as const,
      id: s.id,
      title: requestTitle(s.content),
      owner: `${s.author_name} • ${s.team}`,
      status: s.status,
      date: s.created_at,
      submission: s,
    })),
  ];
  return items.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

/** Chaque élément est dans « Toutes les demandes » et dans l'onglet de sa nature. */
export function filterByTab(items: readonly RequestItem[], tab: RequestTab): RequestItem[] {
  if (tab === "all") return [...items];
  const kind = tab === "blockers" ? "blocker" : "submission";
  return items.filter((i) => i.kind === kind);
}

export function tabCounts(items: readonly RequestItem[]): Record<RequestTab, number> {
  return {
    all: items.length,
    blockers: items.filter((i) => i.kind === "blocker").length,
    submissions: items.filter((i) => i.kind === "submission").length,
  };
}
