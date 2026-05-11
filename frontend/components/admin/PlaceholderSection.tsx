interface Props {
  title: string;
  description: string;
  icon: string;
}

export function PlaceholderSection({ title, description, icon }: Props) {
  return (
    <div className="p-6 lg:p-8 h-full flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">{icon}</div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink)] mb-2">{title}</h1>
        <p className="text-[var(--ink-4)] text-sm">{description}</p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-2)] rounded-full text-xs text-[var(--ink-3)] border border-[var(--line)]">
          🚧 กำลังพัฒนา
        </div>
      </div>
    </div>
  );
}
