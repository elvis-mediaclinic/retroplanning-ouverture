"use server";

import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { transporter } from "@/lib/mailer";

export async function recordView(annonceId: string, visitorId: string) {
  if (!annonceId || !visitorId) return;
  const service = createServiceClient();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  const { error } = await service
    .from("annonce_views")
    .insert({ annonce_id: annonceId, visitor_id: visitorId, viewed_date: today });
  if (error && error.code !== "23505") {
    console.error("[recordView] erreur:", error.message, "| code:", error.code);
  }
}

const Schema = z.object({
  prenom: z.string().min(1, { error: "Prénom requis." }),
  nom: z.string().min(1, { error: "Nom requis." }),
  email: z.email({ error: "Email invalide." }),
  telephone: z.string().optional(),
  apport_personnel: z.coerce.number().positive().optional(),
  message: z.string().optional(),
});

export type CandidatureState = { error?: string; success?: boolean } | undefined;

export async function submitCandidature(
  annonceId: string,
  villeId: string,
  _state: CandidatureState,
  formData: FormData
): Promise<CandidatureState> {
  const parsed = Schema.safeParse({
    prenom: formData.get("prenom"),
    nom: formData.get("nom"),
    email: formData.get("email"),
    telephone: formData.get("telephone") || undefined,
    apport_personnel: formData.get("apport_personnel") || undefined,
    message: formData.get("message") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("candidatures").insert({
    annonce_id: annonceId,
    ville_id: villeId || null,
    ...parsed.data,
    telephone: parsed.data.telephone ?? null,
    apport_personnel: parsed.data.apport_personnel ?? null,
    message: parsed.data.message ?? null,
  });

  if (error) return { error: "Une erreur est survenue. Veuillez réessayer." };

  try {
    const service = createServiceClient();

    // Fetch annonce title
    const { data: annonceData } = await service
      .from("annonces")
      .select("titre, villes(nom)")
      .eq("id", annonceId)
      .single();

    const villeRaw = annonceData?.villes as unknown;
    const villeNom = Array.isArray(villeRaw)
      ? (villeRaw[0] as { nom: string } | undefined)?.nom
      : (villeRaw as { nom: string } | null)?.nom;

    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const notes = [
      `Candidature sur l'annonce "${annonceData?.titre ?? annonceId}" le ${dateStr}`,
      parsed.data.message ?? null,
    ].filter(Boolean).join("\n");

    // Check if candidat already exists
    const { data: existingCandidat } = await service
      .from("candidats")
      .select("id, notes")
      .eq("email", parsed.data.email)
      .maybeSingle();

    let candidatId: string;
    const isRepeat = !!existingCandidat;

    if (!existingCandidat) {
      const { data: newCandidat, error: candidatError } = await service
        .from("candidats")
        .insert({
          prenom: parsed.data.prenom,
          nom: parsed.data.nom,
          email: parsed.data.email,
          telephone: parsed.data.telephone ?? null,
          apport_personnel: parsed.data.apport_personnel ?? null,
          notes,
        })
        .select("id")
        .single();
      if (candidatError) console.error("[candidature] candidat insert:", candidatError.message);
      candidatId = newCandidat?.id ?? "";
    } else {
      candidatId = existingCandidat.id;
      const updatedNotes = [existingCandidat.notes, notes].filter(Boolean).join("\n\n---\n\n");
      await service.from("candidats").update({ notes: updatedNotes }).eq("id", candidatId);
    }

    // Link candidat to ville (upsert — ignore if already linked)
    if (candidatId && villeId) {
      await service
        .from("candidat_villes")
        .upsert({ candidat_id: candidatId, ville_id: villeId }, { onConflict: "candidat_id,ville_id" });
    }

    // Fetch all villes for this candidat (for the email)
    const { data: candidatVilles } = candidatId
      ? await service
          .from("candidat_villes")
          .select("villes(nom)")
          .eq("candidat_id", candidatId)
      : { data: null };

    const villesInteresse = (candidatVilles ?? []).map((cv) => {
      const v = cv.villes as unknown;
      return Array.isArray(v) ? (v[0] as { nom: string })?.nom : (v as { nom: string } | null)?.nom;
    }).filter(Boolean) as string[];

    // Fetch admin emails
    const { data: admins } = await service
      .from("profiles")
      .select("email")
      .eq("role", "admin");

    const adminEmails = (admins ?? []).map((a) => a.email).filter(Boolean) as string[];

    if (adminEmails.length > 0) {
      const d = parsed.data;
      const repeatBanner = isRepeat
        ? `<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:10px 14px;margin-bottom:16px;font-size:13px;color:#92400e">
            ⚠️ <strong>Candidat déjà connu</strong> — cette personne a déjà candidaté précédemment.
           </div>`
        : "";

      const villesBlock = villesInteresse.length > 0
        ? `<tr style="border-top:1px solid #f4f4f5">
             <td style="padding:8px 0;color:#71717a;vertical-align:top">Villes souhaitées</td>
             <td style="padding:8px 0">${villesInteresse.join(", ")}</td>
           </tr>`
        : "";

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: adminEmails.join(", "),
        subject: `${isRepeat ? "[Récidive] " : ""}Candidature franchise — ${villeNom ?? ""}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#18181b">
            <div style="background:#00b9ff;padding:20px 24px;border-radius:8px 8px 0 0">
              <h1 style="color:#fff;margin:0;font-size:18px">
                ${isRepeat ? "Nouvelle candidature (récidive)" : "Nouvelle candidature franchise"}
              </h1>
              ${villeNom ? `<p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:14px">${villeNom}</p>` : ""}
            </div>
            <div style="background:#fff;border:1px solid #e4e4e7;border-top:none;padding:24px;border-radius:0 0 8px 8px">
              ${repeatBanner}
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr>
                  <td style="padding:8px 0;color:#71717a;width:160px">Nom</td>
                  <td style="padding:8px 0;font-weight:600">${d.prenom} ${d.nom}</td>
                </tr>
                <tr style="border-top:1px solid #f4f4f5">
                  <td style="padding:8px 0;color:#71717a">Email</td>
                  <td style="padding:8px 0"><a href="mailto:${d.email}" style="color:#00b9ff">${d.email}</a></td>
                </tr>
                ${d.telephone ? `
                <tr style="border-top:1px solid #f4f4f5">
                  <td style="padding:8px 0;color:#71717a">Téléphone</td>
                  <td style="padding:8px 0">${d.telephone}</td>
                </tr>` : ""}
                ${d.apport_personnel ? `
                <tr style="border-top:1px solid #f4f4f5">
                  <td style="padding:8px 0;color:#71717a">Apport personnel</td>
                  <td style="padding:8px 0;font-weight:600">${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(d.apport_personnel)} €</td>
                </tr>` : ""}
                ${villesBlock}
                ${d.message ? `
                <tr style="border-top:1px solid #f4f4f5">
                  <td style="padding:8px 0;color:#71717a;vertical-align:top">Message</td>
                  <td style="padding:8px 0">${d.message.replace(/\n/g, "<br>")}</td>
                </tr>` : ""}
                <tr style="border-top:1px solid #f4f4f5">
                  <td style="padding:8px 0;color:#71717a">Annonce</td>
                  <td style="padding:8px 0">${annonceData?.titre ?? ""}</td>
                </tr>
              </table>
              <div style="margin-top:24px">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/villes/${villeId}" style="display:inline-block;background:#00b9ff;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500">
                  Voir les candidatures →
                </a>
              </div>
            </div>
            <p style="text-align:center;color:#a1a1aa;font-size:12px;margin-top:16px">Mediaclinic · Réseau de franchise</p>
          </div>
        `,
      });
    }
  } catch (err) {
    console.error("[candidature] secondary operations failed:", err);
  }

  return { success: true };
}
