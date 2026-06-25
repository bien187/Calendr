# Calendr — Familienkalender

Ein gemeinsamer Familien-Kalender als Ersatz für Google Calendar – einfacher,
schneller und übersichtlicher. Personen werden Terminen zugewiesen (nicht nur
Kalendern), Gruppen + Subgruppen strukturieren alles, und Push-Benachrichtigungen
erinnern an anstehende Termine.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Firebase**: Auth (E-Mail + Google), Firestore, Cloud Messaging (FCM)
- **Cloud Functions** (geplante Reminder-Pushes)
- **TailwindCSS** + handgebaute UI-Komponenten (Shadcn-Stil)
- **Zustand** (State), **date-fns** (Datum), **React Hook Form + Zod** (verfügbar)

## Features

- 🔐 Auth: Login / Registrierung / Google-Login
- 👥 **Hauptgruppen** (Shared Spaces) mit Invite-Links, Rollen (Admin/Member)
- 🏷️ **Subgruppen** (Personen/Kategorien) mit Farbcodierung & Filter
- 📅 Drei Kalender-Ansichten: **Monat**, **Woche** (Drag & Drop + Resize), **Liste/Agenda**
- ⚡ Sehr schnelle Event-Erstellung (Bottom Sheet mobil, Seiten-Panel Desktop)
- 🔁 Wiederholungen: täglich / wöchentlich / monatlich / jährlich (+ Intervall)
- 🔔 Erinnerungen: 1 Tag / 3 Std / 1 Std / 15 Min vorher → Push (Web/iOS-PWA/Android)
- 📱 Mobile-first, Bottom-Navigation, Dark Mode, PWA-fähig

## Setup

### 1. Firebase-Projekt anlegen

1. [console.firebase.google.com](https://console.firebase.google.com) → Projekt erstellen
2. **Authentication** → Sign-in method → **E-Mail/Passwort** und **Google** aktivieren
3. **Firestore Database** → erstellen (Production-Modus)
4. **Project Settings → General →** Web-App registrieren → Config kopieren
5. **Project Settings → Cloud Messaging →** Web Push certificates → **VAPID Key** erzeugen

### 2. Environment

```bash
cp .env.example .env.local
```

Trage die Firebase-Web-Config + VAPID-Key in `.env.local` ein.
Trage **dieselben** öffentlichen Werte zusätzlich in
`public/firebase-messaging-sw.js` ein (Service Worker kann keine `process.env`
lesen).

### 3. Installieren & starten

```bash
npm install
npm run dev          # http://localhost:3000
```

### 4. Firestore-Regeln & Indizes deployen

```bash
npm i -g firebase-tools
firebase login
firebase use --add            # Projekt auswählen
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Cloud Functions (Reminder-Pushes)

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

Die Funktion `sendEventReminders` läuft alle 5 Minuten, expandiert
wiederkehrende Termine über die nächsten 24 h und sendet fällige Erinnerungen an
die FCM-Tokens aller Gruppenmitglieder.

> Hinweis: Für garantiertes „genau-einmal“-Senden unter Retries einen Marker
> (`sentReminders/{eventId}_{occ}_{minutes}`) persistieren — als TODO markiert
> in `functions/src/index.ts`.

## Deployment (Vercel)

1. Repo zu GitHub pushen
2. In [Vercel](https://vercel.com) importieren
3. Alle `NEXT_PUBLIC_*` Env-Variablen aus `.env.local` setzen
4. Deploy

## Datenmodell (Firestore)

```
users/{userId}                        Profil, groupIds[], notificationDefaults[], fcmTokens[]
groups/{groupId}                      name, emoji, createdBy, memberIds[], inviteToken
groups/{groupId}/members/{userId}     name, email, role (admin|member)
groups/{groupId}/subgroups/{subId}    name, color
groups/{groupId}/events/{eventId}     title, start, end, allDay, recurrence,
                                      assignedSubgroups[], reminders[], location, …
```

## Projektstruktur

```
src/
  app/
    (app)/            geschützte App (Layout-Guard + Navigation)
      calendar/       Kalender (Monat/Woche/Liste)
      groups/         Gruppen verwalten
      tasks/          Platzhalter
      settings/       Profil, Benachrichtigungen, Theme
    invite/[token]/   Beitritts-Flow
    login/            Auth-Screen
  components/
    calendar/         Header, Views, EventSheet, Filter
    groups/           Create/Manage Sheets
    ui/               Button, Sheet, Field, Avatar
    providers/        Auth/Theme/Workspace
  hooks/useEvents.ts  Range-Subscription + Recurrence + Filter
  lib/                firebase/, recurrence, dates, colors, types
  store/              Zustand (useAuth, useWorkspace)
functions/            Cloud Functions (Reminder-Scheduler)
```

## Roadmap / Bonus

Drag & Drop zwischen Subgruppen · Volltextsuche · Wochen-Zusammenfassung ·
iCal-Export · Aufgaben-Modul.
