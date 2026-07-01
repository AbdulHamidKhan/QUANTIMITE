import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [types, stats] = await Promise.all([
    prisma.educationType.findMany({ orderBy: { name: "asc" } }),
    Promise.all([
      prisma.subject.count({ where: { isPublished: true, deletedAt: null } }),
      prisma.contentItem.count({ where: { isPublished: true, deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
    ]).then(([subjects, items, users]) => ({ subjects, items, users })),
  ]);

  return (
    <div className="space-y-12">
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Learn anything. From school to abroad.
        </h1>
        <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
          Quantimite is a single home for school lessons, undergraduate coursework, and
          study-abroad guides. Curated by teachers, accessible to every learner.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/school" className="px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700">
            Browse school content
          </Link>
          <Link href="/search" className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50">
            Search
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Choose your path</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map((t) => (
            <Link
              key={t.id}
              href={`/${t.slug === "university" ? "undergraduate" : t.slug}`}
              className="block border border-slate-200 rounded-lg p-5 hover:border-brand-500 hover:shadow-sm transition"
            >
              <h3 className="font-semibold text-lg">{t.name}</h3>
              <p className="text-slate-600 text-sm mt-1">{t.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">By the numbers</h2>
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Subjects" value={stats.subjects} />
          <Stat label="Content items" value={stats.items} />
          <Stat label="Learners" value={stats.users} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-slate-200 rounded-lg p-5 text-center">
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  );
}