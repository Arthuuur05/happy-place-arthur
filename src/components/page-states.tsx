/** États communs des pages : chargement et erreur (le menu latéral reste affiché autour). */
export function PageLoading() {
  return (
    <div role="status" className="p-md font-body-md text-body-md text-on-surface-variant">
      Chargement…
    </div>
  );
}

export function PageError({
  onRetry,
  message = "Impossible de charger la page.",
}: {
  onRetry: () => void;
  message?: string;
}) {
  return (
    <div
      role="alert"
      className="m-sm md:m-md space-y-sm border border-error bg-surface-container-lowest p-md"
    >
      <p className="font-body-md text-body-md text-error">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-md py-xs border border-outline bg-surface text-primary font-label-md text-label-md hover:bg-surface-container"
      >
        Réessayer
      </button>
    </div>
  );
}
