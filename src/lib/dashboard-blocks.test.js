import { describe, expect, test } from "bun:test";
import {
  excerpt,
  mostRecent,
  requestTitle,
  shortDate,
  validateNewsDraft,
} from "./dashboard-blocks";

const row = (id, created_at) => ({ id, created_at });

describe("demandes en attente : les 3 plus récentes", () => {
  const items = [
    row("casque", "2026-10-20T09:00:00Z"),
    row("ecran", "2026-10-28T09:00:00Z"),
    row("paie", "2026-10-15T09:00:00Z"),
    row("linkedin", "2026-10-27T09:00:00Z"),
  ];
  test("garde 3 lignes, la plus récente en premier", () => {
    expect(mostRecent(items).map((i) => i.id)).toEqual(["ecran", "linkedin", "casque"]);
  });
  test("moins de 3 éléments : tous, triés", () => {
    expect(mostRecent(items.slice(0, 2)).map((i) => i.id)).toEqual(["ecran", "casque"]);
  });
  test("liste vide", () => {
    expect(mostRecent([])).toEqual([]);
  });
  test("ne modifie pas la liste d'origine", () => {
    const copy = [...items];
    mostRecent(items);
    expect(items).toEqual(copy);
  });
});

describe("titre d'une demande", () => {
  test("première ligne non vide", () => {
    expect(requestTitle("\n\n  Casque audio  \nDétails ici")).toBe("Casque audio");
  });
  test("texte long raccourci avec une ellipse", () => {
    const t = requestTitle("a".repeat(100));
    expect(t.length).toBe(71);
    expect(t.endsWith("…")).toBe(true);
  });
  test("contenu vide", () => {
    expect(requestTitle("   ")).toBe("");
  });
});

describe("actualité : validation du brouillon", () => {
  test("titre et texte valides", () => {
    expect(
      validateNewsDraft({ title: "Résultats du trimestre", body: "Très bons chiffres." }),
    ).toEqual({});
  });
  test("titre vide", () => {
    expect(validateNewsDraft({ title: "  ", body: "Texte correct" }).title).toBe(
      "Le titre est obligatoire.",
    );
  });
  test("texte de 4 caractères refusé, 5 accepté (espaces ignorés)", () => {
    expect(validateNewsDraft({ title: "T", body: " abcd " }).body).toBe(
      "Le texte doit contenir au moins 5 caractères.",
    );
    expect(validateNewsDraft({ title: "T", body: "abcde" }).body).toBeUndefined();
  });
  test("limites hautes", () => {
    expect(validateNewsDraft({ title: "x".repeat(161), body: "abcde" }).title).toBeDefined();
    expect(validateNewsDraft({ title: "T", body: "x".repeat(5001) }).body).toBeDefined();
  });
});

describe("aperçus", () => {
  test("début du texte sur une ligne, raccourci", () => {
    expect(excerpt("Bonjour\n\nà tous")).toBe("Bonjour à tous");
    expect(excerpt("x".repeat(200)).endsWith("…")).toBe(true);
    expect(excerpt(null)).toBe("");
  });
  test("date courte jj/mm", () => {
    expect(shortDate("2026-10-28T12:00:00Z")).toBe("28/10");
  });
});
