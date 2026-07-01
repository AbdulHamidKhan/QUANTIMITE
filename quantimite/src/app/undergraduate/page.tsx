import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function UndergraduateLanding() {
  const et = await prisma.educationType.findUnique({ where: { slug: "university" } });
  if (!et) return <p>Undergraduate section unavailable.</p>;

  const departments = await prisma.department.findMany({
    where: { educationTypeId: et.id, deletedAt: null },
    orderBy: { name: "asc" },
    include: {
      subjects: {
        where: { isPublished: true, deletedAt: null },
        orderBy: [{ classLevel: "asc" }, { name: "asc" }],
      },
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Undergraduate</h1>
        <p className="text-slate-600 mt-2">Choose your department to view subjects.</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-5">
        {departments.map((d) => (
          <div key={d.id} className="border border-slate-200 rounded-lg p-5">
            <h2 className="font-semibold text-lg">{d.name}</h2>
            {d.code && <p className="text-xs text-slate-500">{d.code}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {d.subjects.length === 0 && (
                <span className="text-sm text-slate-500">No subjects published yet.</span>
              )}
              {d.subjects.map((s) => (
                <Link
                  key={s.id}
                  href={`/undergraduate/${d.id}/${s.slug}`}
                  className="text-sm px-3 py-1 rounded border border-slate-300 hover:border-brand-500"
                >
                  {s.name}
                  {s.classLevel ? ` (Yr ${s.classLevel})` : ""}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}