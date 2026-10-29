import { describe, expect, mock, test } from "bun:test";

mock.module("@/integrations/supabase/client", () => ({ supabase: {} }));
const { buildRequestItems, filterByTab, tabCounts } = await import("./requests-tabs");

const blocker = (id, status, updated_at) => ({
  id,
  title: `Blocage ${id}`,
  description: null,
  department: "IT",
  severity: "warning",
  status,
  updated_at,
});
const submission = (id, status, created_at, team = "Direction Commerciale") => ({
  id,
  author_name: "Thomas",
  team,
  content: `Demande ${id}\nDétail`,
  status,
  created_at,
});

const items = buildRequestItems(
  [blocker("b1", "OUVERT", "2026-10-26T09:00:00Z")],
  [
    submission("s1", "en attente", "2026-10-28T09:00:00Z"),
    submission("s2", "validée", "2026-10-20T09:00:00Z"),
    submission("s3", "refusée", "2026-10-10T09:00:00Z"),
  ],
);

describe("page Demandes : onglets", () => {
  test("« Toutes » réunit points bloquants et soumissions, du plus récent au plus ancien", () => {
    expect(filterByTab(items, "all").map((i) => i.id)).toEqual(["s1", "b1", "s2", "s3"]);
  });
  test("« Points bloquants » : seulement les points bloquants", () => {
    expect(filterByTab(items, "blockers").map((i) => i.id)).toEqual(["b1"]);
  });
  test("« Soumissions » : seulement les soumissions, toutes issues d'un statut", () => {
    expect(filterByTab(items, "submissions").map((i) => i.id)).toEqual(["s1", "s2", "s3"]);
  });
  test("compteurs", () => {
    expect(tabCounts(items)).toEqual({ all: 4, blockers: 1, submissions: 3 });
  });
  test("chaque élément garde son statut d'origine", () => {
    expect(items.map((i) => i.status)).toEqual(["en attente", "OUVERT", "validée", "refusée"]);
  });
  test("titre d'une soumission : première ligne du contenu", () => {
    expect(items.find((i) => i.id === "s1").title).toBe("Demande s1");
  });
  test("aucune donnée : trois onglets vides", () => {
    const none = buildRequestItems([], []);
    expect(tabCounts(none)).toEqual({ all: 0, blockers: 0, submissions: 0 });
    expect(filterByTab(none, "blockers")).toEqual([]);
  });
});
