import Link from "next/link";
import { prisma } from "@/lib/db";
import { plainExcerpt } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export default async function AbroadPage() {
  const et = await prisma.educationType.findUnique({ where: { slug: "abroad" } });
  if (!et) return <p>Abroad section unavailable.</p>;

  const guides = await prisma.guide.findMany({
    where: { educationTypeId: et.id, isPublished: true, deletedAt: null },
    orderBy: [{ country: "asc" }, { title: "asc" }],
  });

  const byCountry = new Map<string, typeof guides>();
  for (const g of guides) {
    if (!byCountry.has(g.country)) byCountry.set(g.country, []);
    byCountry.get(g.country)!.push(g);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Study Abroad</h1>
        <p className="text-slate-600 mt-2">
          Guides on admissions, scholarships, visas, and life abroad.
        </p>
      </header>

      {[...byCountry.entries()].map(([country, list]) => (
        <section key={country}>
          <h2 className="text-xl font-semibold mb-3">{country}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map((g) => (
              <Link
                key={g.id}
                href={`/abroad/${g.id}`}
                className="block border border-slate-200 rounded p-4 hover:border-brand-500"
              >
                <div className="text-xs uppercase tracking-wide text-slate-500">{g.category}</div>
                <div className="font-medium mt-1">{g.title}</div>
                {g.bodyHtml && <p className="text-sm text-slate-600 mt-1">{plainExcerpt(g.bodyHtml, 110)}</p>}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}