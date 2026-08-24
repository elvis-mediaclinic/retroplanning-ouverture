import Link from "next/link";
import { requireMarketing } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { NewAnnonceModal } from "./NewAnnonceModal";

export const metadata = { title: "Annonces — Mediaclinic" };

export default async function AnnoncesAdminPage() {
  await requireMarketing();
  const supabase = await createClient();

  const [
    { data: annonces },
    { data: allViews },
    { data: allCandidatures },
    { data: toutesVilles },
  ] = await Promise.all([
    supabase
      .from("annonces")
      .select("id, titre, actif, ville_id, villes(id, nom, departement)")
      .order("created_at", { ascending: false }),
    supabase.from("annonce_views").select("annonce_id, visitor_id"),
    supabase.from("candidatures").select("annonce_id"),
    supabase.from("villes").select("id, nom, departement").order("nom"),
  ]);

  const annonceList = annonces ?? [];
  const views = allViews ?? [];
  const candidatures = allCandidatures ?? [];

  // Stats par annonce
  function statsFor(annonceId: string) {
    const v = views.filter((x) => x.annonce_id === annonceId);
    return {
      total: v.length,
      unique: new Set(v.map((x) => x.visitor_id)).size,
      contacts: candidatures.filter((c) => c.annonce_id === annonceId).length,
    };
  }

  const publiees = annonceList.filter((a) => a.actif);
  const brouillons = annonceList.filter((a) => !a.actif);

  // Stats globales
  const totalViews = views.length;
  const totalUnique = new Set(views.map((v) => v.visitor_id)).size;
  const totalContacts = candidatures.length;

  // Villes disponibles (sans annonce)
  const villesAvecAnnonce = new Set(annonceList.map((a) => a.ville_id));
  const villesDisponibles = (toutesVilles ?? []).filter((v) => !villesAvecAnnonce.has(v.id));

  function getVille(a: typeof annonceList[number]) {
    const raw = a.villes as unknown;
    return Array.isArray(raw)
      ? (raw[0] as { id: string; nom: string; departement?: string } | undefined)
      : (raw as { id: string; nom: string; departement?: string } | null);
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://retroplanning-ouverture.vercel.app";

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="rounded-xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase text-white">Annonces</h1>
          <p className="mt-1 text-sm text-white/70">
            {publiees.length} publiée{publiees.length !== 1 ? "s" : ""} · {brouillons.length} brouillon{brouillons.length !== 1 ? "s" : ""}
          </p>
        </div>
        <NewAnnonceModal villes={villesDisponibles} />
      </div>

      {/* Stats globales */}
      {publiees.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Vues totales", value: totalViews },
            { label: "Visiteurs uniques", value: totalUnique },
            { label: "Contacts reçus", value: totalContacts },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-white/70 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Annonces publiées */}
      {publiees.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Publiées
          </h2>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-br from-[#00729e] to-[#0089bd] text-left">
                  <th className="py-2 px-4 font-medium text-white">Ville</th>
                  <th className="py-2 px-4 font-medium text-white">Titre</th>
                  <th className="py-2 px-4 font-medium text-white text-right">Vues</th>
                  <th className="py-2 px-4 font-medium text-white text-right">Visiteurs</th>
                  <th className="py-2 px-4 font-medium text-white text-right">Contacts</th>
                  <th className="py-2 px-4 font-medium text-white"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {publiees.map((a) => {
                  const ville = getVille(a);
                  const s = statsFor(a.id);
                  return (
                    <tr key={a.id}>
                      <td className="py-3 px-4 text-zinc-600">
                        {ville ? (
                          <span>
                            {ville.nom}
                            {ville.departement && (
                              <span className="ml-1 text-zinc-400 text-xs">({ville.departement})</span>
                            )}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4 font-medium text-zinc-900">{a.titre}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-zinc-700">{s.total}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-zinc-700">{s.unique}</td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        {s.contacts > 0 ? (
                          <span className="font-semibold text-brand">{s.contacts}</span>
                        ) : (
                          <span className="text-zinc-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <a
                            href={`${baseUrl}/annonce/${a.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-400 hover:text-zinc-700"
                          >
                            Voir ↗
                          </a>
                          {ville && (
                            <Link
                              href={`/villes/${ville.id}`}
                              className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline"
                            >
                              Modifier
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Brouillons */}
      {brouillons.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Brouillons
          </h2>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-br from-[#00729e] to-[#0089bd] text-left">
                  <th className="py-2 px-4 font-medium text-white">Ville</th>
                  <th className="py-2 px-4 font-medium text-white">Titre</th>
                  <th className="py-2 px-4 font-medium text-white"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {brouillons.map((a) => {
                  const ville = getVille(a);
                  return (
                    <tr key={a.id} className="opacity-70">
                      <td className="py-3 px-4 text-zinc-500">
                        {ville ? (
                          <span>
                            {ville.nom}
                            {ville.departement && (
                              <span className="ml-1 text-zinc-400 text-xs">({ville.departement})</span>
                            )}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4 text-zinc-700">{a.titre || <span className="italic text-zinc-400">Sans titre</span>}</td>
                      <td className="py-3 px-4 text-right">
                        {ville && (
                          <Link
                            href={`/villes/${ville.id}`}
                            className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline"
                          >
                            Éditer
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {annonceList.length === 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-zinc-400 mb-3">Aucune annonce pour l&apos;instant.</p>
          <NewAnnonceModal villes={villesDisponibles} />
        </div>
      )}
    </div>
  );
}
