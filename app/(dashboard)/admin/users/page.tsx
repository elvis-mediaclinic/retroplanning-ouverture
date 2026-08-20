import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { CreateUserForm } from "./CreateUserForm";
import { EditUserForm } from "./EditUserForm";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  consultant: "Consultant",
  responsable_mc: "Responsable MC",
  franchise: "Franchisé",
};

export default async function AdminUsersPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nom, prenom, email, role, telephone, fonction, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Utilisateurs</h1>
        <p className="text-sm text-zinc-500">
          L&apos;auto-inscription est désactivée : seul un admin peut créer un compte.
        </p>
      </div>

      <CreateUserForm />

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
              <th className="py-2 px-4 font-medium text-zinc-600">Nom</th>
              <th className="py-2 px-4 font-medium text-zinc-600">Email</th>
              <th className="py-2 px-4 font-medium text-zinc-600">Rôle</th>
              <th className="py-2 px-4 font-medium text-zinc-600">Fonction</th>
              <th className="py-2 px-4 font-medium text-zinc-600"></th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((p) => (
              <tr key={p.id} className="border-b border-zinc-100 last:border-0 align-middle">
                <td className="py-2 px-4 text-zinc-900">
                  {p.prenom} {p.nom}
                </td>
                <td className="py-2 px-4 text-zinc-600">{p.email}</td>
                <td className="py-2 px-4">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    {ROLE_LABELS[p.role] ?? p.role}
                  </span>
                </td>
                <td className="py-2 px-4 text-zinc-500 text-xs">
                  {p.fonction ?? <span className="text-zinc-300">—</span>}
                </td>
                <td className="py-2 px-4">
                  <EditUserForm profile={p} />
                </td>
              </tr>
            ))}
            {(profiles ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 px-4 text-zinc-400">
                  Aucun utilisateur pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
