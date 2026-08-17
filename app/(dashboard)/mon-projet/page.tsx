import { redirect } from "next/navigation";
import { getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

// Le franchisé est redirigé vers la page de son projet réel.
// S'il n'a pas encore de projet assigné, on l'informe.
export default async function MonProjetPage() {
  const profile = await getProfile();

  if (profile.role !== "franchise") {
    redirect("/");
  }

  const supabase = await createClient();
  const { data: projet } = await supabase
    .from("projets")
    .select("id")
    .eq("franchisee_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (projet) {
    redirect(`/projets/${projet.id}`);
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-4xl mb-4">🏗️</p>
      <h1 className="text-lg font-semibold text-zinc-900">
        Votre projet n&apos;est pas encore disponible
      </h1>
      <p className="mt-2 text-sm text-zinc-500 max-w-sm">
        L&apos;équipe Mediaclinic vous assignera votre projet d&apos;ouverture dès
        que tout sera prêt. Vous recevrez un email de notification.
      </p>
    </div>
  );
}
