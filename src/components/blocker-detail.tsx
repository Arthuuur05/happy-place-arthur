import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { formatExactDate } from "@/components/expandable-card";
import { updateBlockerStatus, type Blocker } from "@/lib/dashboard";

const STATUSES = ["OUVERT", "EN COURS", "SURVEILLANCE", "RÉSOLU"] as const;

/**
 * Détail d'un point bloquant, même gabarit que la lecture d'une soumission (fond clair).
 * L'admin peut changer son statut (jamais OUVERT → RÉSOLU directement, règle imposée par la base) ;
 * les autres rôles le consultent.
 */
export function BlockerDetail({
  blocker,
  isAdmin,
  onClose,
}: {
  blocker: Blocker | null;
  isAdmin: boolean;
  onClose: () => void;
}) {
  return (
    <DialogPrimitive.Root open={!!blocker} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        {blocker && (
          <DialogPrimitive.Content className="fixed z-50 inset-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[min(48rem,calc(100vw-2rem))] h-dvh md:h-auto md:max-h-[85vh] flex flex-col bg-surface-container-lowest border border-outline shadow-lg focus:outline-none">
            <div className="flex items-start justify-between gap-sm border-b border-outline-variant p-md">
              <div className="min-w-0">
                <DialogPrimitive.Title className="font-headline-sm text-headline-sm text-primary wrap-anywhere">
                  {blocker.title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="font-label-sm text-label-sm text-on-surface-variant">
                  Point bloquant • {blocker.department} • Mis à jour le{" "}
                  {formatExactDate(blocker.updated_at)}
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close
                aria-label="Fermer"
                className="text-on-surface-variant hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span aria-hidden="true" className="material-symbols-outlined">
                  close
                </span>
              </DialogPrimitive.Close>
            </div>
            <div className="flex-1 overflow-y-auto p-md space-y-md">
              {blocker.description && (
                <p className="font-body-md text-body-md text-on-surface whitespace-pre-line wrap-anywhere">
                  {blocker.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-sm font-label-sm text-label-sm">
                <span className="bg-surface-container-highest px-xs py-0.5">
                  {blocker.department}
                </span>
                <span className="text-on-surface-variant">Sévérité : {blocker.severity}</span>
              </div>
              <BlockerStatusSelect key={blocker.id} blocker={blocker} isAdmin={isAdmin} />
            </div>
          </DialogPrimitive.Content>
        )}
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function BlockerStatusSelect({ blocker, isAdmin }: { blocker: Blocker; isAdmin: boolean }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState(blocker.status);
  const change = useMutation({
    mutationFn: updateBlockerStatus,
    onSuccess: (_d, vars) => {
      setStatus(vars.status);
      toast.success("Statut mis à jour");
      void qc.invalidateQueries({ queryKey: ["blockers"] });
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });

  return (
    <label className="flex flex-wrap items-center gap-xs font-label-sm text-label-sm text-on-surface-variant">
      Statut
      <select
        aria-label={`Statut de ${blocker.title}`}
        value={status}
        disabled={!isAdmin || change.isPending}
        onChange={(e) => change.mutate({ id: blocker.id, status: e.target.value })}
        className="border border-outline-variant bg-surface px-sm py-xs font-body-md text-primary disabled:opacity-70"
      >
        {STATUSES.map((s) => (
          <option
            key={s}
            value={s}
            disabled={s === "RÉSOLU" && status === "OUVERT"}
            title={s === "RÉSOLU" && status === "OUVERT" ? "Passe d'abord par EN COURS" : undefined}
          >
            {s}
          </option>
        ))}
      </select>
    </label>
  );
}
