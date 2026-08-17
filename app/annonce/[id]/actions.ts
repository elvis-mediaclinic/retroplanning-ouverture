"use server";

import * as z from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { transporter } from "@/lib/mailer";

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

  // Insert candidature
  const { error } = await supabase.from("candidatures").insert({
    annonce_id: annonceId,
    ville_id: villeId || null,
    ...parsed.data,
    telephone: parsed.data.telephone ?? null,
    apport_personnel: parsed.data.apport_personnel ?? null,
    message: parsed.data.message ?? null,
  });

  if (error) return { error: "Une erreur est survenue. Veuillez réessayer." };

  // Secondary operations: create candidat + send email.
  // These run after the candidature is saved — a failure here doesn't block
  // the user but is logged server-side for investigation.
  try {
    const service = createServiceClient();

    // Upsert candidat (deduplicated by email)
    const { data: existingCandidat } = await service
      .from("candidats")
      .select("id")
      .eq("email", parsed.data.email)
      .maybeSingle();

    if (!existingCandidat) {
      const { error: candidatError } = await service.from("candidats").insert({
        prenom: parsed.data.prenom,
        nom: parsed.data.nom,
        email: parsed.data.email,
        telephone: parsed.data.telephone ?? null,
        ville_id: villeId || null,
      });
      if (candidatError) console.error("[candidature] candidat insert:", candidatError.message);
    }

    // Fetch annonce + ville name for the email
    const { data: annonce } = await service
      .from("annonces")
      .select("titre, villes(nom)")
      .eq("id", annonceId)
      .single();

    const villeRaw = annonce?.villes as unknown;
    const villeNom = Array.isArray(villeRaw)
      ? (villeRaw[0] as { nom: string } | undefined)?.nom
      : (villeRaw as { nom: string } | null)?.nom;

    // Fetch admin emails
    const { data: admins } = await service
      .from("profiles")
      .select("email, prenom, nom")
      .eq("role", "admin");

    const adminEmails = (admins ?? [])
      .map((a) => a.email)
      .filter(Boolean) as string[];

    // Send notification email
    if (adminEmails.length > 0) {
      const d = parsed.data;

      await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: adminEmails.join(", "),
      subject: `Nouvelle candidature franchise — ${villeNom ?? ""}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#18181b">
          <div style="background:#00b9ff;padding:20px 24px;border-radius:8px 8px 0 0">
            <h1 style="color:#fff;margin:0;font-size:18px">Nouvelle candidature franchise</h1>
            ${villeNom ? `<p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:14px">${villeNom}</p>` : ""}
          </div>
          <div style="background:#fff;border:1px solid #e4e4e7;border-top:none;padding:24px;border-radius:0 0 8px 8px">
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
              ${d.message ? `
              <tr style="border-top:1px solid #f4f4f5">
                <td style="padding:8px 0;color:#71717a;vertical-align:top">Message</td>
                <td style="padding:8px 0">${d.message.replace(/\n/g, "<br>")}</td>
              </tr>` : ""}
              <tr style="border-top:1px solid #f4f4f5">
                <td style="padding:8px 0;color:#71717a">Annonce</td>
                <td style="padding:8px 0">${annonce?.titre ?? ""}</td>
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
