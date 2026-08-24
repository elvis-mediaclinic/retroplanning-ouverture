import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { CreateUserModal } from "./CreateUserModal";
import { EditUserForm } from "./EditUserForm";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  consultant: "Consultant",
  responsable_mc: "Responsable MC",
  franchise: "Franchisé",
};

const ROLE_ORDER = ["admin", "consultant", "responsable_mc", "franchise"];

type Profile = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  telephone: string | null;
  fonction: string | null;
  created_at: string;
};

function UserTable({ profiles }: { profiles: Profile[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gradient-to-br from-[#00729e] to-[#0089bd] text-left">
            <th className="py-2 px-4 font-medium text-white">Nom</th>
            <th className="py-2 px-4 font-medium text-white">Email</th>
            <th className="py-2 px-4 font-medium text-white">Fonction</th>
            <th className="py-2 px-4 font-medium text-white"></th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id} className="border-b border-zinc-100 last:border-0 align-middle">
              <td className="py-2 px-4 text-zinc-900">
                {p.prenom} {p.nom}
              </td>
              <td className="py-2 px-4 text-zinc-600">{p.email}</td>
              <td className="py-2 px-4 text-zinc-500 text-xs">
                {p.fonction ?? <span className="text-zinc-300">—</span>}
              </td>
              <td className="py-2 px-4">
                <EditUserForm profile={p} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminUsersPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, nom, prenom, email, role, telephone, fonction, created_at")
    .order("created_at", { ascending: false });

  const profiles = (data ?? []) as Profile[];

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase text-white">Utilisateurs</h1>
          <p className="mt-1 text-sm text-white/70">
            L&apos;auto-inscription est désactivée : seul un admin peut créer un compte.
          </p>
        </div>
        <CreateUserModal />
      </div>

      {ROLE_ORDER.map((role) => {
        const forRole = profiles.filter((p) => p.role === role);
        if (forRole.length === 0) return null;
        return (
          <section key={role}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {ROLE_LABELS[role]} ({forRole.length})
            </h2>
            <UserTable profiles={forRole} />
          </section>
        );
      })}

      {profiles.length === 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-zinc-400">Aucun utilisateur pour l&apos;instant.</p>
        </div>
      )}
    </div>
  );
}
