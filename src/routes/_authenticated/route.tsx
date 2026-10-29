import {
  CatchBoundary,
  createFileRoute,
  isRedirect,
  Outlet,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { PageError } from "@/components/page-states";
import { fetchOwnRole } from "@/lib/auth";

// Version élèves : un compte connecté sans rôle est envoyé vers /choisir-role
// (au lieu d'être déconnecté comme dans l'app d'origine, réservée à une liste blanche).
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) throw redirect({ to: "/auth" });
      const email = data.user.email ?? "";
      const role = email ? await fetchOwnRole(email) : null;
      if (!role) throw redirect({ to: "/choisir-role" });
      return { user: data.user, email, role };
    } catch (e) {
      if (isRedirect(e)) throw e;
      // Session périmée ou compte changé dans un autre onglet : retour propre à la connexion.
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { role } = Route.useRouteContext();
  const router = useRouter();
  return (
    <AppShell role={role}>
      {/* Une page qui plante garde le menu visible ; changer de page réinitialise l'erreur. */}
      <CatchBoundary
        getResetKey={() => router.state.location.pathname}
        errorComponent={({ reset }) => (
          <PageError
            onRetry={() => {
              reset();
              void router.invalidate();
            }}
          />
        )}
      >
        <Outlet />
      </CatchBoundary>
    </AppShell>
  );
}
