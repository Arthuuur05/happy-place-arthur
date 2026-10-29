import { describe, expect, test } from "bun:test";
import { canAccess, isNavActive, visibleNavItems } from "./nav";

const labels = (role) => visibleNavItems(role).map((i) => i.label);

describe("menu latéral : entrées par rôle", () => {
  test("l'admin voit les 5 entrées, dans l'ordre", () => {
    expect(labels("admin")).toEqual([
      "Dashboard",
      "Fil d'actualités",
      "Demandes",
      "Équipes",
      "Profil",
    ]);
  });
  test("le manager voit 4 entrées, sans Équipes", () => {
    expect(labels("manager")).toEqual(["Dashboard", "Fil d'actualités", "Demandes", "Profil"]);
  });
  test("le collaborateur voit 4 entrées, sans Équipes", () => {
    expect(labels("collaborateur")).toEqual([
      "Dashboard",
      "Fil d'actualités",
      "Demandes",
      "Profil",
    ]);
  });
  test("sans rôle, aucune entrée", () => {
    expect(labels(null)).toEqual([]);
  });
});

describe("menu latéral : accès aux pages", () => {
  test("Équipes est réservée à l'admin", () => {
    expect(canAccess("admin", "/equipes")).toBe(true);
    expect(canAccess("manager", "/equipes")).toBe(false);
    expect(canAccess("collaborateur", "/equipes")).toBe(false);
  });
  test("les autres pages sont ouvertes à tous les rôles", () => {
    for (const role of ["admin", "manager", "collaborateur"]) {
      for (const to of ["/", "/actualites", "/demandes", "/profil"])
        expect(canAccess(role, to)).toBe(true);
    }
  });
});

describe("menu latéral : entrée active", () => {
  test("le dashboard n'est actif que sur « / »", () => {
    expect(isNavActive("/", "/")).toBe(true);
    expect(isNavActive("/", "/demandes")).toBe(false);
  });
  test("Demandes est surlignée sur sa page seulement", () => {
    expect(isNavActive("/demandes", "/demandes")).toBe(true);
    expect(isNavActive("/demandes", "/profil")).toBe(false);
    expect(isNavActive("/actualites", "/manage/news")).toBe(false);
  });
});
