"use client";

export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3.5 backdrop-blur">
      <h1 className="text-lg font-bold tracking-tight">{title}</h1>
      {action}
    </header>
  );
}
