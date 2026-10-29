import { redirect } from "@tanstack/react-router";

const KEY = "hp:access-denied";

/** Renvoie vers le dashboard ; le message est affiché une fois par le menu (voir AppShell). */
export function denyAccess(): never {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // sessionStorage indisponible : la redirection reste effective, sans message
  }
  throw redirect({ to: "/" });
}

/** Lit puis efface le drapeau « accès refusé ». */
export function consumeAccessDenied(): boolean {
  try {
    if (sessionStorage.getItem(KEY) !== "1") return false;
    sessionStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}
