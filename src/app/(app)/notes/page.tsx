"use client";

import { NotebookPen } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export default function NotesPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Notizen" />
      <div className="grid place-items-center px-6 py-24 text-center">
        <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
          <NotebookPen className="h-7 w-7" />
        </div>
        <p className="font-medium">Notizen kommen bald</p>
        <p className="mt-1 max-w-xs text-sm text-muted">
          Gemeinsame Notizen und Listen pro Gruppe – als Nächstes auf der
          Roadmap.
        </p>
      </div>
    </div>
  );
}
