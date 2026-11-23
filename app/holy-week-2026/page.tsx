import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/PageHeader";

// Archived: kept so nothing from the previous site is lost. It is a past schedule, so
// search engines are asked not to index it and it is out of the sitemap and navigation.
export const metadata: Metadata = {
  title: "2026 Holy Week Service Schedule (archived)",
  robots: { index: false, follow: true },
  alternates: { canonical: "/holy-week-2026" },
};

type Day = { date: string; note?: string; services: { time: string; what: string }[] };

const DAYS: Day[] = [
  {
    date: "Friday, April 3",
    note: "Conclusion of Holy Lent",
    services: [
      { time: "8:00–9:00 AM", what: "Morning incense" },
      { time: "9:00–10:30 AM", what: "Kandeel (unction of the sick)" },
      { time: "10:30–12:30", what: "Divine Liturgy" },
    ],
  },
  {
    date: "Saturday, April 4",
    note: "Lazarus Saturday",
    services: [
      { time: "8:00–10:30 AM", what: "Divine Liturgy" },
      { time: "6:00–8:00 PM", what: "Vespers for Palm Sunday, Midnight Praises" },
    ],
  },
  {
    date: "Palm Sunday, April 5",
    services: [
      { time: "7:00–8:30 AM", what: "Morning incense & Cross procession" },
      { time: "8:30–11:00 AM", what: "Divine Liturgy" },
      { time: "11:00 AM–12:00 PM", what: "General Funeral Prayers" },
      { time: "6:00–8:00 PM", what: "Evening Pascha" },
    ],
  },
  {
    date: "Monday, April 6",
    services: [
      { time: "6:00–9:00 AM", what: "Morning Pascha" },
      { time: "5:00–8:00 PM", what: "Evening Pascha" },
    ],
  },
  {
    date: "Tuesday, April 7 and Wednesday, April 8",
    services: [
      { time: "8:00–11:00 AM", what: "Morning Pascha" },
      { time: "6:00–9:00 PM", what: "Evening Pascha" },
    ],
  },
  {
    date: "Thursday, April 9",
    note: "Covenant Thursday",
    services: [
      { time: "8:00–10:00 AM", what: "Morning Pascha" },
      { time: "10:00–11:00 AM", what: "Laqan" },
      { time: "11:00 AM–12:30 PM", what: "Divine Liturgy" },
    ],
  },
  {
    date: "Friday, April 10",
    note: "Good Friday",
    services: [{ time: "8:00 AM–5:00 PM", what: "Pascha prayers" }],
  },
  {
    date: "Friday night, April 10 to Saturday morning, April 11",
    services: [{ time: "11:00 PM–4:00 AM", what: "Apocalypse night" }],
  },
  {
    date: "Joyful Saturday, April 11",
    services: [{ time: "6:00–10:00 PM", what: "Resurrection Liturgy" }],
  },
];

export default function HolyWeekArchivePage() {
  return (
    <>
      <PageHeader title="2026 Holy Week Service Schedule" />
      <Container>
        <div role="note" className="mb-12 max-w-3xl border-l-4 border-gilt bg-vellum-deep p-5">
          <p className="font-bold text-oxblood">This schedule has passed.</p>
          <p className="mt-1">
            It is kept here for reference. Divine Liturgy is prayed on Saturday mornings, 8:00 – 11:00 AM; see{" "}
            <Link href="/visit-us" className="link">
              how to visit
            </Link>{" "}
            for the address.
          </p>
        </div>

        {/* A dated sequence: the vertical line and markers carry real information (the order of the week). */}
        <ol className="relative max-w-3xl space-y-10 border-l border-gilt pl-8">
          {DAYS.map((day) => (
            <li key={day.date} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[2.45rem] top-2 flex size-6 items-center justify-center bg-vellum text-gilt"
              >
                <svg viewBox="0 0 22 22" fill="currentColor" className="size-5">
                  <path d="M9 0h4v9h9v4h-9v9H9v-9H0V9h9z" />
                </svg>
              </span>
              <h2 className="text-2xl sm:text-3xl">{day.date}</h2>
              {day.note ? <p className="font-display text-xl italic text-gilt-deep">{day.note}</p> : null}
              <ul className="mt-3 space-y-1.5">
                {day.services.map((s) => (
                  <li key={s.time + s.what} className="grid grid-cols-[9.5rem_1fr] gap-x-4 sm:grid-cols-[11rem_1fr]">
                    <span className="font-bold tabular-nums text-ink">{s.time}</span>
                    <span>{s.what}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Container>
    </>
  );
}
