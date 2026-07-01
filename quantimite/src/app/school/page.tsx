import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SchoolLanding() {
  const educationType = await prisma.educationType.findUnique({ where: { slug: "school" } });
  if (!educationType) return <p>School content unavailable.</p>;

  // Group subjects by classLevel for navigation.
  const subjects = await prisma.subject.findMany({
    where: { educationTypeId: educationType.id, isPublished: true, deletedAt: null },
    orderBy: [{ classLevel: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, classLevel: true },
  });

  const byClass = new Map<number, typeof subjects>();
  for (const s of subjects) {
    const lvl = s.classLevel ?? -1;
    if (!byClass.has(lvl)) byClass.set(lvl, []);
    byClass.get(lvl)!.push(s);
  }
  const levels = [...byClass.keys()].filter((l) => l >= 0).sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">School (Class 0–12)</h1>
        <p className="text-slate-600 mt-2">Pick your class to view subjects and chapters.</p>
      </header>

      {levels.length === 0 && (
        <p className="text-slate-500">No classes published yet.</p>
      )}

      {levels.map((lvl) => (
        <section key={lvl}>
          <h2 className="text-xl font-semibold mb-3">Class {lvl}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {byClass.get(lvl)!.map((s) => (
              <Link
                key={s.id}
                href={`/school/${s.classLevel}/${s.slug}`}
                className="block border border-slate-200 rounded p-4 hover:border-brand-500"
              >
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-slate-500 mt-1">/{s.slug}</div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}