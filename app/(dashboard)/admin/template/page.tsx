import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { ImportTemplateForm } from "./ImportTemplateForm";
import { TemplateEditor } from "./TemplateEditor";

export default async function TemplatePage() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: etapes } = await supabase
    .from("etapes_template")
    .select("id, phase, nom, ordre")
    .order("ordre");

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-[#00729e] to-[#0089bd] p-6 shadow-sm">
        <h1 className="text-2xl font-bold uppercase text-white">Template retroplanning</h1>
        <p className="mt-1 text-sm text-white/70">
          Ces étapes sont copiées lors de la création de chaque nouveau projet.
        </p>
      </div>

      <ImportTemplateForm />

      <TemplateEditor etapes={etapes ?? []} />
    </div>
  );
}
