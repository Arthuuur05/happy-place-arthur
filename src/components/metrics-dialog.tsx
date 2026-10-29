import * as DialogPrimitive from "@radix-ui/react-dialog";
import { MetricsAdmin } from "@/components/manage/metrics-admin";

/**
 * Édition des indicateurs (admin) : liste, historique, nouvel indicateur, modifier, supprimer.
 * Centrée avec `m-auto` plutôt qu'avec une translation : un `transform` rattacherait les fenêtres
 * imbriquées (modifier, confirmer) à ce cadre au lieu de l'écran.
 */
export function MetricsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        {open && (
          <DialogPrimitive.Content className="fixed z-50 inset-0 m-auto flex h-dvh w-full flex-col border border-outline bg-surface-container-lowest shadow-lg focus:outline-none md:h-fit md:max-h-[85vh] md:w-[min(56rem,calc(100vw-2rem))]">
            <div className="flex items-start justify-between gap-sm border-b border-outline-variant p-md">
              <div className="min-w-0">
                <DialogPrimitive.Title className="font-headline-sm text-headline-sm text-primary">
                  Modifier les indicateurs
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="font-label-sm text-label-sm text-on-surface-variant">
                  Créer, modifier ou supprimer un indicateur, et consulter son historique
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
            <div className="flex-1 overflow-y-auto p-md">
              <MetricsAdmin />
            </div>
          </DialogPrimitive.Content>
        )}
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
