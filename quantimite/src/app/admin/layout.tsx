import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import LogoutButton from "./LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = cookies().get("qm_access")?.value;
  if (!access) redirect("/login?next=/admin");
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <LogoutButton />
      </header>
      {children}
    </div>
  );
}