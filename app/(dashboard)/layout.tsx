import { getProfile } from "@/lib/dal";
import { Sidebar } from "./Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        role={profile.role}
        userName={`${profile.prenom} ${profile.nom}`}
        fonction={profile.fonction}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1600px] px-6 pt-1.5 pb-8">{children}</div>
      </main>
    </div>
  );
}
