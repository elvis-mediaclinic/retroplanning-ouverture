"use server";

import * as z from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { transporter } from "@/lib/mailer";

const Schema = z.object({
  prenom: z.string().min(1, { error: "Prénom requis." }),
  nom: z.string().min(1, { error: "Nom requis." }),
  email: z.email({ error: "Email invalide." }),
  telephone: z.string().optional(),
  ville: z.string().min(1, { error: "Ville souhaitée requise." }),
  departement: z.string().optional(),
  region: z.string().optional(),
  message: z.string().optional(),
});

export type InteretSpontaneState = { error?: string; success?: boolean } | undefined;

export async function submitInteretSpontane(
  _state: InteretSpontaneState,
  formData: FormData
): Promise<InteretSpontaneState> {
  const parsed = Schema.safeParse({
    prenom: formData.get("prenom"),
    nom: formData.get("nom"),
    email: formData.get("email"),
    telephone: formData.get("telephone") || undefined,
    ville: formData.get("ville"),
    departement: formData.get("departement") || undefined,
    region: formData.get("region") || undefined,
    message: formData.get("message") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const d = parsed.data;
  const service = createServiceClient();

  // Réutilise la ville si elle existe déjà, sinon la crée comme proposition à valider
  const { data: existingVille } = await service
    .from("villes")
    .select("id")
    .ilike("nom", d.ville)
    .maybeSingle();

  let villeId = existingVille?.id ?? null;
  let villeCreee = false;

  if (!villeId) {
    const { data: newVille, error: villeError } = await service
      .from("villes")
      .insert({
        nom: d.ville,
        departement: d.departement ?? null,
        region: d.region ?? null,
        statut: "proposition",
        notes: `Proposée via un intérêt spontané par ${d.prenom} ${d.nom} (${d.email}).`,
      })
      .select("id")
      .single();
    if (!villeError && newVille) {
      villeId = newVille.id;
      villeCreee = true;
    }
  }

  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const notes = [
    `Intérêt spontané pour ${d.ville} le ${dateStr}`,
    d.message ?? null,
  ].filter(Boolean).join("\n");

  const { data: existingCandidat } = await service
    .from("candidats")
    .select("id, notes")
    .eq("email", d.email)
    .maybeSingle();

  let candidatId: string;
  if (existingCandidat) {
    candidatId = existingCandidat.id;
    const updatedNotes = [existingCandidat.notes, notes].filter(Boolean).join("\n\n---\n\n");
    await service.from("candidats").update({ notes: updatedNotes, zone_souhaitee: d.ville }).eq("id", candidatId);
  } else {
    const { data: newCandidat, error: candidatError } = await service
      .from("candidats")
      .insert({
        prenom: d.prenom,
        nom: d.nom,
        email: d.email,
        telephone: d.telephone ?? null,
        zone_souhaitee: d.ville,
        notes,
      })
      .select("id")
      .single();
    candidatId = newCandidat?.id ?? "";
    if (candidatError) console.error("[interet-spontane] candidat insert:", candidatError.message);
  }

  if (candidatId && villeId) {
    await service
      .from("candidat_villes")
      .upsert({ candidat_id: candidatId, ville_id: villeId }, { onConflict: "candidat_id,ville_id" });
  }

  try {
    const { data: profiles } = await service.from("profiles").select("email, fonction");
    const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const emails = (profiles ?? [])
      .filter((p) => p.fonction && normalize(p.fonction).includes("developpeur franchise"))
      .map((p) => p.email)
      .filter(Boolean) as string[];

    if (emails.length > 0) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: emails.join(", "),
        subject: `Intérêt spontané — ${d.ville}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#18181b">
            <div style="background:#0089bd;padding:20px 24px;border-radius:8px 8px 0 0">
              <h1 style="color:#fff;margin:0;font-size:18px">Intérêt spontané pour une ville non listée</h1>
              <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:14px">${d.ville}</p>
            </div>
            <div style="background:#fff;border:1px solid #e4e4e7;border-top:none;padding:24px;border-radius:0 0 8px 8px">
              ${villeCreee ? `
              <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:6px;padding:10px 14px;margin-bottom:16px;font-size:13px;color:#5b21b6">
                🆕 Cette ville n&apos;existait pas encore — elle a été créée en statut « Proposition à valider ».
              </div>` : ""}
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr>
                  <td style="padding:8px 0;color:#71717a;width:160px">Nom</td>
                  <td style="padding:8px 0;font-weight:600">${d.prenom} ${d.nom}</td>
                </tr>
                <tr style="border-top:1px solid #f4f4f5">
                  <td style="padding:8px 0;color:#71717a">Email</td>
                  <td style="padding:8px 0"><a href="mailto:${d.email}" style="color:#0089bd">${d.email}</a></td>
                </tr>
                ${d.telephone ? `
                <tr style="border-top:1px solid #f4f4f5">
                  <td style="padding:8px 0;color:#71717a">Téléphone</td>
                  <td style="padding:8px 0">${d.telephone}</td>
                </tr>` : ""}
                <tr style="border-top:1px solid #f4f4f5">
                  <td style="padding:8px 0;color:#71717a">Ville souhaitée</td>
                  <td style="padding:8px 0;font-weight:600">${d.ville}${d.departement ? ` (${d.departement})` : ""}</td>
                </tr>
                ${d.message ? `
                <tr style="border-top:1px solid #f4f4f5">
                  <td style="padding:8px 0;color:#71717a;vertical-align:top">Message</td>
                  <td style="padding:8px 0">${d.message.replace(/\n/g, "<br>")}</td>
                </tr>` : ""}
              </table>
              <div style="margin-top:24px">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/villes${villeId ? `/${villeId}` : ""}" style="display:inline-block;background:#0089bd;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500">
                  Voir la ville →
                </a>
              </div>
            </div>
            <p style="text-align:center;color:#a1a1aa;font-size:12px;margin-top:16px">Mediaclinic · Réseau de franchise</p>
          </div>
        `,
      });
    }
  } catch (err) {
    console.error("[interet-spontane] envoi email:", err);
  }

  return { success: true };
}
