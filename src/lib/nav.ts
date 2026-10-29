import type { AppRole } from "@/lib/auth";

export type NavTo = "/" | "/actualites" | "/demandes" | "/equipes" | "/profil";

export type NavItem = { to: NavTo; label: string; icon: string; roles: readonly AppRole[] };

const ALL_ROLES = ["admin", "manager", "collaborateur"] as const;

/** Ordre figé du menu latéral (spec « Menu latéral ») ; Équipes est réservée à l'admin. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: "/", label: "Dashboard", icon: "dashboard", roles: ALL_ROLES },
  { to: "/actualites", label: "Fil d'actualités", icon: "newspaper", roles: ALL_ROLES },
  { to: "/demandes", label: "Demandes", icon: "forum", roles: ALL_ROLES },
  { to: "/equipes", label: "Équipes", icon: "groups", roles: ["admin"] },
  { to: "/profil", label: "Profil", icon: "person", roles: ALL_ROLES },
];

export function visibleNavItems(role: AppRole | null | undefined): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((i) => i.roles.includes(role));
}

export function canAccess(role: AppRole | null | undefined, to: NavTo): boolean {
  return visibleNavItems(role).some((i) => i.to === to);
}

/** Le dashboard est actif uniquement sur « / » ; les autres entrées le sont sur leur page et ses sous-pages. */
export function isNavActive(to: NavTo, pathname: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export const ACCESS_DENIED_MESSAGE = "Vous n'avez pas accès à cette page.";
