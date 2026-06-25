"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function NoGroup() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-xs">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
          <Users className="h-7 w-7" />
        </div>
        <h1 className="text-lg font-semibold">Willkommen bei Calendr</h1>
        <p className="mt-1 text-sm text-muted">
          Erstelle eine Gruppe für deine Familie oder WG – oder tritt über einen
          Einladungslink bei.
        </p>
        <Link href="/groups">
          <Button className="mt-5 w-full" size="lg">
            Gruppe erstellen
          </Button>
        </Link>
      </div>
    </div>
  );
}
