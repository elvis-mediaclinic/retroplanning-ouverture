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
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Template retroplanning</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ces étapes sont copiées lors de la création de chaque nouveau projet.
        </p>
      </div>

      <ImportTemplateForm />

      <TemplateEditor etapes={etapes ?? []} />
    </div>
  );
}
