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
