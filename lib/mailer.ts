import "server-only";
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendInvitationEmail({
  to,
  prenom,
  inviteLink,
}: {
  to: string;
  prenom: string;
  inviteLink: string;
}) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `"Mediaclinic" <${process.env.SMTP_USER}>`,
    to,
    subject: "Votre accès Mediaclinic – Suivi des ouvertures",
    html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-size:22px;font-weight:800;color:#18181b;letter-spacing:-0.5px;">Mediaclinic</span>
              <p style="margin:4px 0 0;font-size:12px;color:#71717a;">Suivi des ouvertures</p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;padding:40px 36px;">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#18181b;">
                Bonjour ${prenom},
              </h1>
              <p style="margin:0 0 24px;font-size:14px;color:#52525b;line-height:1.6;">
                L'équipe Mediaclinic vous a créé un accès pour suivre l'avancement
                de votre projet d'ouverture. Cliquez sur le bouton ci-dessous pour
                définir votre mot de passe et accéder à votre espace.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="border-radius:8px;background-color:#18181b;">
                    <a href="${inviteLink}"
                       style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      Créer mon mot de passe →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 4px;font-size:12px;color:#a1a1aa;">
                Ce lien est valable 24 heures. Si vous n'êtes pas à l'origine de cette invitation,
                vous pouvez ignorer cet email.
              </p>
              <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;" />
              <p style="margin:0;font-size:11px;color:#a1a1aa;">
                Lien alternatif si le bouton ne fonctionne pas :<br />
                <a href="${inviteLink}" style="color:#71717a;word-break:break-all;">${inviteLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:20px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#a1a1aa;">© Mediaclinic · Réseau de franchise</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}
