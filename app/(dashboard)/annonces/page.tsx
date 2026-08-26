import Link from "next/link";
import { requireMarketingOrConsultant } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { NewAnnonceModal } from "./NewAnnonceModal";
import { AnnonceRow, VoirArticleLink } from "./AnnonceRow";
import { CopyConsultantLink } from "./CopyConsultantLink";
import { ShareAnnonceModal } from "./ShareAnnonceModal";

export const metadata = { title: "Annonces — Mediaclinic" };

export default async function AnnoncesAdminPage() {
  const profile = await requireMarketingOrConsultant();
  const isConsultant = profile.role === "consultant";
  const supabase = await createClient();

  const [
    { data: annonces },
    { data: cessionAnnonces },
    { data: allViews },
    { data: allCandidatures },
    { data: toutesVilles },
    { data: annonceConsultants },
    { data: consultantsData },
  ] = await Promise.all([
    supabase
      .from("annonces")
      .select("id, titre, actif, ville_id, villes(id, nom, departement)")
      .eq("type_annonce", "ouverture")
      .order("created_at", { ascending: false }),
    supabase
      .from("annonces")
      .select("id, titre, actif, magasin_id, magasins(id, nom, ville, code_postal)")
      .eq("type_annonce", "cession")
      .order("created_at", { ascending: false }),
    supabase.from("annonce_views").select("annonce_id, visitor_id"),
    supabase.from("candidatures").select("annonce_id"),
    supabase.from("villes").select("id, nom, departement").order("nom"),
    isConsultant
      ? supabase.from("annonce_consultants").select("annonce_id").eq("consultant_id", profile.id)
      : supabase.from("annonce_consultants").select("annonce_id, consultant_id"),
    isConsultant
      ? Promise.resolve({ data: null })
      : supabase.from("profiles").select("id, prenom, nom").eq("role", "consultant").order("prenom"),
  ]);

  const consultants = consultantsData ?? [];
  const sharedAnnonceIds = new Set((annonceConsultants ?? []).map((ac) => ac.annonce_id));
  const consultantsByAnnonce = new Map<string, string[]>();
  for (const ac of (annonceConsultants ?? []) as { annonce_id: string; consultant_id?: string }[]) {
    if (!ac.consultant_id) continue;
    if (!consultantsByAnnonce.has(ac.annonce_id)) consultantsByAnnonce.set(ac.annonce_id, []);
    consultantsByAnnonce.get(ac.annonce_id)!.push(ac.consultant_id);
  }

  function getVille(a: { villes: unknown }) {
    const raw = a.villes;
    return Array.isArray(raw)
      ? (raw[0] as { id: string; nom: string; departement?: string } | undefined)
      : (raw as { id: string; nom: string; departement?: string } | null);
  }

  function getMagasin(a: { magasins: unknown }) {
    const raw = a.magasins;
    return Array.isArray(raw)
      ? (raw[0] as { id: string; nom: string; ville: string | null; code_postal: string | null } | undefined)
      : (raw as { id: string; nom: string; ville: string | null; code_postal: string | null } | null);
  }

  // Fusionne ouvertures et cessions dans une forme commune pour l'affichage
  const annonceList = [
    ...(annonces ?? []).map((a) => ({
      id: a.id,
      titre: a.titre,
      actif: a.actif,
      isCession: false as const,
      lieu: getVille(a),
      href: getVille(a) ? `/villes/${getVille(a)!.id}/annonce` : null,
      sousTitre: null as string | null,
    })),
    ...(cessionAnnonces ?? []).map((a) => {
      const magasin = getMagasin(a);
      return {
        id: a.id,
        titre: a.titre,
        actif: a.actif,
        isCession: true as const,
        lieu: magasin ? { id: magasin.id, nom: magasin.nom, departement: undefined } : null,
        href: magasin ? `/reseau/${magasin.id}/cession` : null,
        sousTitre: magasin ? [magasin.code_postal, magasin.ville].filter(Boolean).join(" ") : null,
      };
    }),
  ];

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

  // Villes disponibles (sans annonce d'ouverture)
  const villesAvecAnnonce = new Set((annonces ?? []).map((a) => a.ville_id));
  const villesDisponibles = (toutesVilles ?? []).filter((v) => !villesAvecAnnonce.has(v.id));

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://retroplanning-ouverture.vercel.app";

  if (isConsultant) {
    const partagees = publiees.filter((a) => sharedAnnonceIds.has(a.id));
    return (
      <div className="space-y-8">
        <div className="page-header">
          <h1 className="page-header-title">Annonces</h1>
          <p className="page-header-subtitle">
            {partagees.length} annonce{partagees.length !== 1 ? "s" : ""} partagée{partagees.length !== 1 ? "s" : ""} avec vous — copiez votre lien pour être identifié comme apporteur
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          {/* Mobile : cartes */}
          <div className="sm:hidden divide-y divide-zinc-100">
            {partagees.map((a) => (
              <div key={a.id} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-zinc-900">{a.titre}</p>
                  {a.isCession && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                      Cession
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {a.lieu ? `${a.lieu.nom}${a.lieu.departement ? ` (${a.lieu.departement})` : ""}` : "—"}
                  {a.sousTitre && ` · ${a.sousTitre}`}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <a
                    href={`${baseUrl}/annonce/${a.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-400 hover:text-zinc-700"
                  >
                    Voir l&apos;annonce ↗
                  </a>
                  <CopyConsultantLink
                    href={`${baseUrl}/annonce/${a.id}?c=${profile.id}`}
                    className="text-xs font-medium text-brand hover:text-brand-dark"
                  />
                </div>
              </div>
            ))}
            {partagees.length === 0 && (
              <p className="py-6 px-4 text-center text-zinc-400">Aucune annonce partagée avec vous pour l&apos;instant.</p>
            )}
          </div>

          {/* Desktop : tableau */}
          <table className="hidden sm:table w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-br from-[#00729e] to-[#0089bd] text-left">
                <th className="py-2 px-4 font-medium text-white">Ville / Magasin</th>
                <th className="py-2 px-4 font-medium text-white">Titre</th>
                <th className="py-2 px-4 font-medium text-white"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {partagees.map((a) => (
                <tr key={a.id}>
                  <td className="py-3 px-4 text-zinc-600">
                    {a.lieu ? (
                      <span>
                        {a.lieu.nom}
                        {a.lieu.departement && (
                          <span className="ml-1 text-zinc-400 text-xs">({a.lieu.departement})</span>
                        )}
                        {a.sousTitre && (
                          <span className="ml-1 text-zinc-400 text-xs">({a.sousTitre})</span>
                        )}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="py-3 px-4 font-medium text-zinc-900">
                    <span className="flex items-center gap-2">
                      {a.titre}
                      {a.isCession && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                          Cession
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <a
                        href={`${baseUrl}/annonce/${a.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-400 hover:text-zinc-700"
                      >
                        Voir l&apos;annonce ↗
                      </a>
                      <CopyConsultantLink
                        href={`${baseUrl}/annonce/${a.id}?c=${profile.id}`}
                        className="text-xs font-medium text-brand hover:text-brand-dark"
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {partagees.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 px-4 text-center text-zinc-400">Aucune annonce partagée avec vous pour l&apos;instant.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-header-title">Annonces</h1>
          <p className="page-header-subtitle">
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
            {/* Mobile : cartes */}
            <div className="sm:hidden divide-y divide-zinc-100">
              {publiees.map((a) => {
                const s = statsFor(a.id);
                return (
                  <div key={a.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-900">{a.titre}</p>
                      {a.isCession && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                          Cession
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {a.lieu ? `${a.lieu.nom}${a.lieu.departement ? ` (${a.lieu.departement})` : ""}` : "—"}
                      {a.sousTitre && ` · ${a.sousTitre}`}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-zinc-600">
                      <span>{s.total} vue{s.total !== 1 ? "s" : ""}</span>
                      <span>{s.unique} visiteur{s.unique !== 1 ? "s" : ""}</span>
                      <span className={s.contacts > 0 ? "font-semibold text-brand" : "text-zinc-400"}>
                        {s.contacts} contact{s.contacts !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <a
                        href={`${baseUrl}/annonce/${a.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-400 hover:text-zinc-700"
                      >
                        Voir l&apos;article ↗
                      </a>
                      <ShareAnnonceModal
                        annonceId={a.id}
                        consultants={consultants}
                        sharedWith={consultantsByAnnonce.get(a.id) ?? []}
                      />
                      {a.href && (
                        <Link
                          href={a.href}
                          className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline"
                        >
                          Modifier
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop : tableau */}
            <table className="hidden sm:table w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-br from-[#00729e] to-[#0089bd] text-left">
                  <th className="py-2 px-4 font-medium text-white">Ville / Magasin</th>
                  <th className="py-2 px-4 font-medium text-white">Titre</th>
                  <th className="py-2 px-4 font-medium text-white text-right">Vues</th>
                  <th className="py-2 px-4 font-medium text-white text-right">Visiteurs</th>
                  <th className="py-2 px-4 font-medium text-white text-right">Contacts</th>
                  <th className="py-2 px-4 font-medium text-white"></th>
                  <th className="py-2 px-4 font-medium text-white"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {publiees.map((a) => {
                  const s = statsFor(a.id);
                  return (
                    <AnnonceRow key={a.id} href={a.href}>
                      <td className="py-3 px-4 text-zinc-600">
                        {a.lieu ? (
                          <span>
                            {a.lieu.nom}
                            {a.lieu.departement && (
                              <span className="ml-1 text-zinc-400 text-xs">({a.lieu.departement})</span>
                            )}
                            {a.sousTitre && (
                              <span className="ml-1 text-zinc-400 text-xs">({a.sousTitre})</span>
                            )}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4 font-medium text-zinc-900">
                        <span className="flex items-center gap-2">
                          {a.titre}
                          {a.isCession && (
                            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                              Cession
                            </span>
                          )}
                        </span>
                      </td>
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
                        <VoirArticleLink
                          href={`${baseUrl}/annonce/${a.id}`}
                          className="text-xs text-zinc-400 hover:text-zinc-700"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <ShareAnnonceModal
                          annonceId={a.id}
                          consultants={consultants}
                          sharedWith={consultantsByAnnonce.get(a.id) ?? []}
                        />
                      </td>
                    </AnnonceRow>
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
            {/* Mobile : cartes */}
            <div className="sm:hidden divide-y divide-zinc-100">
              {brouillons.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 px-4 py-3 opacity-70">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-zinc-700 truncate">{a.titre || <span className="italic text-zinc-400">Sans titre</span>}</p>
                      {a.isCession && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                          Cession
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">
                      {a.lieu ? `${a.lieu.nom}${a.lieu.departement ? ` (${a.lieu.departement})` : ""}` : "—"}
                      {a.sousTitre && ` · ${a.sousTitre}`}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <a
                      href={`${baseUrl}/annonce/${a.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-400 hover:text-zinc-700"
                    >
                      Voir l&apos;article ↗
                    </a>
                    {a.href && (
                      <Link
                        href={a.href}
                        className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline"
                      >
                        Éditer
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop : tableau */}
            <table className="hidden sm:table w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-br from-[#00729e] to-[#0089bd] text-left">
                  <th className="py-2 px-4 font-medium text-white">Ville / Magasin</th>
                  <th className="py-2 px-4 font-medium text-white">Titre</th>
                  <th className="py-2 px-4 font-medium text-white"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {brouillons.map((a) => (
                  <AnnonceRow key={a.id} href={a.href} className="opacity-70">
                    <td className="py-3 px-4 text-zinc-500">
                      {a.lieu ? (
                        <span>
                          {a.lieu.nom}
                          {a.lieu.departement && (
                            <span className="ml-1 text-zinc-400 text-xs">({a.lieu.departement})</span>
                          )}
                          {a.sousTitre && (
                            <span className="ml-1 text-zinc-400 text-xs">({a.sousTitre})</span>
                          )}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-4 text-zinc-700">
                      <span className="flex items-center gap-2">
                        {a.titre || <span className="italic text-zinc-400">Sans titre</span>}
                        {a.isCession && (
                          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                            Cession
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <VoirArticleLink
                        href={`${baseUrl}/annonce/${a.id}`}
                        className="text-xs text-zinc-400 hover:text-zinc-700"
                      />
                    </td>
                  </AnnonceRow>
                ))}
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
