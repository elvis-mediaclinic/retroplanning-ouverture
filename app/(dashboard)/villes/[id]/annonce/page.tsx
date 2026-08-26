import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMC, getProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { AnnonceEditor } from "../AnnonceEditor";
import { upsertAnnonce } from "../annonce-actions";

export default async function VilleAnnoncePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMC();
  const profile = await getProfile();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: ville }, { data: annonce }] = await Promise.all([
    supabase.from("villes").select("id, nom").eq("id", id).single(),
    supabase
      .from("annonces")
      .select("id, titre, accroche, contenu, contenu_json, sections, actif, hero_bleu, hero_carte, hero_titre_centre, hero_accroche_centre")
      .eq("ville_id", id)
      .maybeSingle(),
  ]);

  if (!ville) notFound();

  const canEdit =
    profile.role === "admin" ||
    profile.role === "consultant" ||
    (profile.role === "responsable_mc" && !!profile.fonction?.toLowerCase().includes("marketing"));

  if (!canEdit) notFound();

  let viewStats: { total: number; unique: number } | null = null;
  if (annonce?.id) {
    const { data: views } = await supabase
      .from("annonce_views")
      .select("visitor_id")
      .eq("annonce_id", annonce.id);
    if (views) {
      viewStats = {
        total: views.length,
        unique: new Set(views.map((v) => v.visitor_id)).size,
      };
    }
  }

  const action = upsertAnnonce.bind(null, id, annonce?.id ?? null);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://retroplanning-ouverture.vercel.app";
  const publicUrl = annonce ? `${baseUrl}/annonce/${annonce.id}` : `${baseUrl}/annonce/[id]`;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-header-title">Annonce franchisé — {ville.nom}</h1>
        <p className="page-header-subtitle">
          Publie une annonce publique pour attirer des candidats sur cette zone.
        </p>
      </div>
      <div>
        <Link href={`/villes/${id}`} className="text-sm text-zinc-500 hover:text-zinc-900">
          ← {ville.nom}
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        {viewStats && annonce?.actif && (
          <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
            <span>
              <span className="font-semibold text-zinc-900">{viewStats.total}</span> vue{viewStats.total !== 1 ? "s" : ""}
            </span>
            <span>
              <span className="font-semibold text-zinc-900">{viewStats.unique}</span> visiteur{viewStats.unique !== 1 ? "s" : ""} unique{viewStats.unique !== 1 ? "s" : ""}
            </span>
          </div>
        )}
        <AnnonceEditor action={action} annonce={annonce ?? null} publicUrl={publicUrl} />
      </div>
    </div>
  );
}
