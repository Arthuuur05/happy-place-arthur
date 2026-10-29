/** Barre d'onglets (Demandes, Équipes) : l'onglet actif est surligné. */
export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: readonly { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex flex-wrap gap-xs border-b border-outline-variant pb-sm"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`px-md py-xs border font-label-md text-label-md ${
            active === t.id
              ? "bg-primary text-on-primary border-primary"
              : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
