import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { BrandHeader } from "@/components/brand-header";
import type { AppRole } from "@/lib/auth";
import { consumeAccessDenied } from "@/lib/access";
import { ACCESS_DENIED_MESSAGE, isNavActive, visibleNavItems } from "@/lib/nav";

function SideNav({ role }: { role: AppRole }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      aria-label="Navigation principale"
      className="flex shrink-0 gap-xs overflow-x-auto border-b border-outline-variant bg-surface-container-lowest p-xs md:w-60 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:p-sm"
    >
      {visibleNavItems(role).map((item) => {
        const active = isNavActive(item.to, pathname);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-xs whitespace-nowrap px-md py-xs font-label-md text-label-md uppercase transition-colors ${
              active
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Cadre commun des pages connectées : en-tête de marque, menu latéral toujours visible, contenu. */
export function AppShell({ role, children }: { role: AppRole; children: ReactNode }) {
  useEffect(() => {
    if (consumeAccessDenied()) toast.error(ACCESS_DENIED_MESSAGE);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface font-body-md">
      <BrandHeader />
      <div className="mx-auto flex w-full max-w-interface flex-1 flex-col md:flex-row">
        <SideNav role={role} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
