import { describe, expect, test } from "bun:test";
import { filterUsers, normalizeSearch } from "./user-search";

const user = (o) => ({
  first_name: null,
  last_name: null,
  email: "x@y.test",
  team: null,
  teams: [],
  ...o,
});
const users = [
  user({
    first_name: "Gontran",
    last_name: "Martin",
    email: "gontran@bb.test",
    team: "Relation clients",
  }),
  user({
    first_name: "Kesha",
    last_name: "Diallo",
    email: "kesha@bb.test",
    teams: ["Direction Commerciale", "Marketing"],
  }),
  user({
    first_name: "Éloïse",
    last_name: "Petit",
    email: "eloise@bb.test",
    team: "Relation clients",
  }),
  user({ email: "sans.nom@bb.test", team: "Finance" }),
];
const names = (q) => filterUsers(users, q).map((u) => u.first_name ?? u.email);

describe("recherche d'un compte", () => {
  test("« gon » : Gontran seulement", () => {
    expect(names("gon")).toEqual(["Gontran"]);
  });
  test("« relation » : tous les comptes de Relation clients", () => {
    expect(names("relation")).toEqual(["Gontran", "Éloïse"]);
  });
  test("majuscules ignorées", () => {
    expect(names("KESHA")).toEqual(["Kesha"]);
  });
  test("accents ignorés dans les deux sens", () => {
    expect(names("eloise")).toEqual(["Éloïse"]);
    expect(names("ÉLOÏSE")).toEqual(["Éloïse"]);
  });
  test("aucun résultat", () => {
    expect(names("zzz")).toEqual([]);
  });
  test("champ vide ou espaces : tous les comptes", () => {
    expect(names("")).toHaveLength(4);
    expect(names("   ")).toHaveLength(4);
  });
  test("espaces avant et après ignorés", () => {
    expect(names("  gon  ")).toEqual(["Gontran"]);
  });
  test("compte sans nom ni prénom : trouvé par son email", () => {
    expect(names("sans.nom")).toEqual(["sans.nom@bb.test"]);
  });
  test("manager de plusieurs équipes : trouvé par chacune", () => {
    expect(names("marketing")).toEqual(["Kesha"]);
    expect(names("commerciale")).toEqual(["Kesha"]);
  });
  test("prénom et nom, dans les deux ordres", () => {
    expect(names("gontran martin")).toEqual(["Gontran"]);
    expect(names("martin gontran")).toEqual(["Gontran"]);
  });
  test("le rôle n'est pas cherché", () => {
    expect(names("manager")).toEqual([]);
  });
  test("normalisation", () => {
    expect(normalizeSearch("  Éloïse   PETIT ")).toBe("eloise petit");
  });
});
