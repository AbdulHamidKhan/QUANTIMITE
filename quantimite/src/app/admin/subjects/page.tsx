import { prisma } from "@/lib/db";
import SubjectForm from "./SubjectForm";

export const dynamic = "force-dynamic";

export default async function AdminSubjects() {
  const [subjects, ets, departments] = await Promise.all([
    prisma.subject.findMany({
      where: { deletedAt: null },
      orderBy: [{ educationTypeId: "asc" }, { classLevel: "asc" }, { name: "asc" }],
      include: { educationType: true, department: true, _count: { select: { chapters: true } } },
    }),
    prisma.educationType.findMany(),
    prisma.department.findMany({ where: { deletedAt: null } }),
  ]);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <section className="md:col-span-2">
        <h2 className="text-lg font-semibold mb-3">All subjects</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2">Name</th>
                <th>Type</th>
                <th>Level</th>
                <th>Dept</th>
                <th>Ch.</th>
                <th>Published</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="py-2">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-slate-500">/{s.slug}</div>
                  </td>
                  <td>{s.educationType.slug}</td>
                  <td>{s.classLevel ?? "-"}</td>
                  <td>{s.department?.name ?? "-"}</td>
                  <td>{s._count.chapters}</td>
                  <td>{s.isPublished ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Create subject</h2>
        <SubjectForm
          educationTypes={ets.map((e) => ({ id: e.id, slug: e.slug, name: e.name }))}
          departments={departments.map((d) => ({ id: d.id, name: d.name, educationTypeId: d.educationTypeId }))}
        />
      </section>
    </div>
  );
}