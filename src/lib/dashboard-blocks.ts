/** Règles pures des blocs « Demandes en attente » et « Actualités récentes » du dashboard. */

export const DASHBOARD_BLOCK_SIZE = 3;

export const NEWS_BODY_MIN = 5;
export const NEWS_TITLE_MAX = 160;
export const NEWS_BODY_MAX = 5000;

/** Titre d'une demande : sa première ligne non vide, raccourcie (une demande n'a pas de titre en base). */
export function requestTitle(content: string, max = 70): string {
  const line = content.split("\n").find((l) => l.trim() !== "") ?? "";
  const text = line.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** Les n éléments les plus récents d'abord (ne modifie pas la liste d'origine). */
export function mostRecent<T extends { created_at: string }>(
  items: readonly T[],
  n = DASHBOARD_BLOCK_SIZE,
): T[] {
  return [...items].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, n);
}

/** Début du texte d'une actualité, sur une seule ligne. */
export function excerpt(body: string | null | undefined, max = 140): string {
  const text = (body ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** Date courte (jj/mm) utilisée dans les blocs du dashboard. */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export type NewsDraftErrors = { title?: string; body?: string };

/** Titre obligatoire, texte de 5 caractères minimum. */
export function validateNewsDraft(input: { title: string; body: string }): NewsDraftErrors {
  const errors: NewsDraftErrors = {};
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) errors.title = "Le titre est obligatoire.";
  else if (title.length > NEWS_TITLE_MAX) errors.title = `${NEWS_TITLE_MAX} caractères maximum.`;
  if (body.length < NEWS_BODY_MIN)
    errors.body = `Le texte doit contenir au moins ${NEWS_BODY_MIN} caractères.`;
  else if (body.length > NEWS_BODY_MAX) errors.body = `${NEWS_BODY_MAX} caractères maximum.`;
  return errors;
}

export const NEWS_SAVE_ERROR = "L'actualité n'a pas pu être enregistrée. Réessayez.";
export const NEWS_PUBLISH_ERROR = "L'actualité n'a pas pu être publiée. Réessayez.";
