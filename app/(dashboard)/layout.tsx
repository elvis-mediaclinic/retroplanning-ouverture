import { getProfile } from "@/lib/dal";
import { Sidebar } from "./Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role={profile.role}
        userName={`${profile.prenom} ${profile.nom}`}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
