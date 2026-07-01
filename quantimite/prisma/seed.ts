import { PrismaClient, EducationTypeSlug, ContentType, Role, GuideCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Education types
  const school = await prisma.educationType.upsert({
    where: { slug: "school" },
    update: {},
    create: {
      slug: EducationTypeSlug.school,
      name: "School (Class 0-12)",
      description: "Curriculum-aligned content for school students.",
    },
  });

  const university = await prisma.educationType.upsert({
    where: { slug: "university" },
    update: {},
    create: {
      slug: EducationTypeSlug.university,
      name: "Undergraduate",
      description: "Department and year-based content for undergrads.",
    },
  });

  const abroad = await prisma.educationType.upsert({
    where: { slug: "abroad" },
    update: {},
    create: {
      slug: EducationTypeSlug.abroad,
      name: "Study Abroad",
      description: "Admissions, scholarships, and visa guides.",
    },
  });

  // Departments (for university) + a sentinel "General" department per non-university track
  const deptNames = [
    { name: "Computer Science & Engineering", code: "CSE" },
    { name: "Electrical & Electronic Engineering", code: "EEE" },
    { name: "Bachelor of Business Administration", code: "BBA" },
  ];
  for (const d of deptNames) {
    await prisma.department.upsert({
      where: { educationTypeId_name: { educationTypeId: university.id, name: d.name } },
      update: {},
      create: { educationTypeId: university.id, name: d.name, code: d.code },
    });
  }

  // Sentinel "General" department for school and abroad — used when a Subject has no real department.
  const schoolGeneral = await prisma.department.upsert({
    where: { educationTypeId_name: { educationTypeId: school.id, name: "General" } },
    update: {},
    create: { educationTypeId: school.id, name: "General", code: "GEN" },
  });
  await prisma.department.upsert({
    where: { educationTypeId_name: { educationTypeId: abroad.id, name: "General" } },
    update: {},
    create: { educationTypeId: abroad.id, name: "General", code: "GEN" },
  });

  // Superadmin
  const adminEmail = "admin@quantimite.local";
  const adminHash = await bcrypt.hash("ChangeMe!123", 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      name: "Quantimite Admin",
      role: Role.superadmin,
    },
  });

  // Sample school subject: Class 9 Mathematics
  const math9 = await prisma.subject.upsert({
    where: {
      educationTypeId_departmentId_classLevel_slug: {
        educationTypeId: school.id,
        departmentId: schoolGeneral.id,
        classLevel: 9,
        slug: "mathematics",
      },
    },
    update: {},
    create: {
      educationTypeId: school.id,
      departmentId: schoolGeneral.id,
      classLevel: 9,
      name: "Mathematics",
      slug: "mathematics",
      description: "Class 9 Mathematics — algebra, geometry, statistics.",
      isPublished: true,
    },
  });

  const chapter = await prisma.chapter.upsert({
    where: { subjectId_slug: { subjectId: math9.id, slug: "intro-to-algebra" } },
    update: {},
    create: {
      subjectId: math9.id,
      title: "Introduction to Algebra",
      slug: "intro-to-algebra",
      order: 1,
      isPublished: true,
    },
  });

  await prisma.contentItem.upsert({
    where: { chapterId_slug: { chapterId: chapter.id, slug: "what-is-a-variable" } },
    update: {},
    create: {
      chapterId: chapter.id,
      type: ContentType.article,
      title: "What is a variable?",
      slug: "what-is-a-variable",
      bodyHtml:
        "<p>A <strong>variable</strong> is a symbol that stands for a number we don't know yet. Example: <code>x + 5 = 12</code>.</p>",
      order: 1,
      isPublished: true,
    },
  });

  await prisma.contentItem.upsert({
    where: { chapterId_slug: { chapterId: chapter.id, slug: "intro-video" } },
    update: {},
    create: {
      chapterId: chapter.id,
      type: ContentType.video,
      title: "Intro video (YouTube)",
      slug: "intro-video",
      youtubeId: "dQw4w9WgXcQ",
      order: 0,
      isPublished: true,
    },
  });

  // Abroad sample guide
  await prisma.guide.upsert({
    where: { educationTypeId_slug: { educationTypeId: abroad.id, slug: "us-f1-visa-overview" } },
    update: {},
    create: {
      educationTypeId: abroad.id,
      country: "United States",
      university: "Any",
      category: GuideCategory.visa,
      title: "US F-1 Visa Overview",
      slug: "us-f1-visa-overview",
      bodyHtml:
        "<h2>F-1 student visa basics</h2><p>Steps, documents, and timelines for applying.</p>",
      isPublished: true,
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });