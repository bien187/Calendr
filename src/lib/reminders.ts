export const REMINDER_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 15, label: "15 Min. vorher" },
  { minutes: 60, label: "1 Std. vorher" },
  { minutes: 180, label: "3 Std. vorher" },
  { minutes: 1440, label: "1 Tag vorher" },
];

export function reminderLabel(minutes: number) {
  return (
    REMINDER_OPTIONS.find((r) => r.minutes === minutes)?.label ??
    `${minutes} Min. vorher`
  );
}
