// Un titre peut contenir des mots mis en bleu depuis l'éditeur admin, marqués
// par **ainsi** (sélection de texte -> bouton "Bleu"). Rendu ici en <span> bleu.
export function renderTitreRiche(titre: string) {
  return titre.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <span key={i} className="text-brand">{part.slice(2, -2)}</span>
      : part
  );
}
