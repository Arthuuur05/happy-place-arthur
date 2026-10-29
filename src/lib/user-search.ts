/** Recherche d'un compte par nom, prénom, adresse mail ou équipe (page Équipes). */

export type SearchableUser = {
  first_name: string | null;
  last_name: string | null;
  email: string;
  team: string | null;
  /** Équipes d'un manager. */
  teams: string[];
};

/** Minuscules, sans accents, espaces multiples réduits, espaces de bord retirés. */
export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function haystack(u: SearchableUser): string {
  const first = u.first_name ?? "";
  const last = u.last_name ?? "";
  // Prénom Nom et Nom Prénom : « gontran martin » comme « martin gontran » trouvent le compte.
  return normalizeSearch(
    [`${first} ${last}`, `${last} ${first}`, u.email, u.team ?? "", ...u.teams].join(" "),
  );
}

/** Champ vide : tous les comptes. Le rôle n'est volontairement pas cherché. */
export function matchesUser(u: SearchableUser, query: string): boolean {
  const q = normalizeSearch(query);
  return q === "" || haystack(u).includes(q);
}

export function filterUsers<T extends SearchableUser>(users: readonly T[], query: string): T[] {
  return users.filter((u) => matchesUser(u, query));
}

export type TeamMemberUser = SearchableUser & { role: string };

/** Membres d'une équipe : collaborateurs rattachés à cette équipe, managers qui la gèrent. */
export function teamMembers<U extends TeamMemberUser>(teamName: string, users: readonly U[]): U[] {
  return users.filter(
    (u) =>
      (u.role === "collaborateur" && u.team === teamName) ||
      (u.role === "manager" && u.teams.includes(teamName)),
  );
}

function matchesPerson(u: SearchableUser, q: string): boolean {
  const first = u.first_name ?? "";
  const last = u.last_name ?? "";
  return normalizeSearch(`${first} ${last} ${last} ${first} ${u.email}`).includes(q);
}

export type TeamMatch<T, U> = { team: T; matched: U[] };

/**
 * Équipes dont le nom contient la recherche, ou qui comptent une personne dont le nom, le prénom
 * ou l'adresse la contient (`matched` liste alors ces personnes). Champ vide : toutes les équipes.
 */
export function filterTeams<T extends { name: string }, U extends TeamMemberUser>(
  teams: readonly T[],
  users: readonly U[],
  query: string,
): TeamMatch<T, U>[] {
  const q = normalizeSearch(query);
  if (q === "") return teams.map((team) => ({ team, matched: [] }));
  return teams
    .map((team) => ({
      team,
      byName: normalizeSearch(team.name).includes(q),
      matched: teamMembers(team.name, users).filter((u) => matchesPerson(u, q)),
    }))
    .filter((m) => m.byName || m.matched.length > 0)
    .map(({ team, matched }) => ({ team, matched }));
}
