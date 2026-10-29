import { describe, expect, test } from "bun:test";
import { filterTeams, filterUsers, normalizeSearch, teamMembers } from "./user-search";

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

describe("recherche d'une équipe", () => {
  const people = [
    user({
      first_name: "Gontran",
      last_name: "Martin",
      email: "gontran@bb.test",
      team: "Relation clients",
      role: "collaborateur",
    }),
    user({
      first_name: "Kesha",
      last_name: "Diallo",
      email: "kesha@bb.test",
      teams: ["Direction Commerciale", "Marketing"],
      role: "manager",
    }),
    user({
      first_name: "Éloïse",
      last_name: "Petit",
      email: "eloise@bb.test",
      team: "Relation clients",
      role: "collaborateur",
    }),
    user({ first_name: "Olivia", last_name: "Roche", email: "olivia@bb.test", role: "admin" }),
  ];
  const teams = [
    { name: "Direction Commerciale" },
    { name: "Marketing" },
    { name: "Relation clients" },
    { name: "Finance" },
  ];
  const found = (q) => filterTeams(teams, people, q).map((m) => m.team.name);

  test("champ vide : toutes les équipes", () => {
    expect(found("")).toEqual([
      "Direction Commerciale",
      "Marketing",
      "Relation clients",
      "Finance",
    ]);
    expect(found("   ")).toHaveLength(4);
  });
  test("par nom d'équipe, sans accents ni majuscules", () => {
    expect(found("RELATION")).toEqual(["Relation clients"]);
    expect(found("direction")).toEqual(["Direction Commerciale"]);
  });
  test("par nom de personne : l'équipe de la personne, avec la personne trouvée", () => {
    const r = filterTeams(teams, people, "gontran");
    expect(r.map((m) => m.team.name)).toEqual(["Relation clients"]);
    expect(r[0].matched.map((u) => u.first_name)).toEqual(["Gontran"]);
  });
  test("un manager de plusieurs équipes les remonte toutes", () => {
    expect(found("kesha")).toEqual(["Direction Commerciale", "Marketing"]);
  });
  test("accents ignorés pour une personne", () => {
    expect(found("eloise")).toEqual(["Relation clients"]);
  });
  test("recherche sur le nom d'équipe : aucune personne listée", () => {
    expect(filterTeams(teams, people, "marketing")[0].matched).toEqual([]);
  });
  test("aucun résultat", () => {
    expect(found("zzz")).toEqual([]);
  });
  test("le rôle n'est pas cherché", () => {
    expect(found("manager")).toEqual([]);
  });
  test("membres d'une équipe : collaborateurs et managers, pas les admins", () => {
    expect(teamMembers("Relation clients", people).map((u) => u.first_name)).toEqual([
      "Gontran",
      "Éloïse",
    ]);
    expect(teamMembers("Marketing", people).map((u) => u.first_name)).toEqual(["Kesha"]);
  });
});
