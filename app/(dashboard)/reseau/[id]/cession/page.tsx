import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { AnnonceEditor } from "../../../villes/[id]/AnnonceEditor";
import { upsertCessionAnnonce } from "../../cession-actions";

export default async function CessionAnnoncePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: magasin }, { data: annonceCession }] = await Promise.all([
    supabase.from("magasins").select("id, nom, archive").eq("id", id).single(),
    supabase
      .from("annonces")
      .select("id, titre, accroche, contenu, contenu_json, sections, actif, hero_bleu, hero_carte, hero_titre_centre, hero_accroche_centre")
      .eq("magasin_id", id)
      .eq("type_annonce", "cession")
      .maybeSingle(),
  ]);

  if (!magasin) notFound();

  const cessionAction = upsertCessionAnnonce.bind(null, id, annonceCession?.id ?? null);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://retroplanning-ouverture.vercel.app";
  const cessionPublicUrl = annonceCession ? `${baseUrl}/annonce/${annonceCession.id}` : `${baseUrl}/annonce/[id]`;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-header-title">Annonce de cession — {magasin.nom}</h1>
        <p className="page-header-subtitle">
          Publie une annonce publique pour trouver un repreneur à ce magasin — distincte des annonces
          d&apos;ouverture, elle apparaît marquée « Cession » dans les opportunités et sur la carte publique.
        </p>
      </div>
      <div>
        <Link href={`/reseau/${id}`} className="text-sm text-zinc-500 hover:text-zinc-900">
          ← {magasin.nom}
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <AnnonceEditor action={cessionAction} annonce={annonceCession ?? null} publicUrl={cessionPublicUrl} />
      </div>
    </div>
  );
}
