export type UserRole = "admin" | "consultant" | "franchise" | "responsable_mc";

export type Profile = {
  id: string;
  role: UserRole;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  fonction: string | null;
  created_at: string;
};

export type TypeMagasin = "integre" | "franchise";

export type FormatMagasin =
  | "classique"
  | "galerie"
  | "centre_ville"
  | "kiosque"
  | "shop_in_shop";

export type StatutVille = "en_etude" | "validee" | "abandonnee";

export type StatutCandidat =
  | "prospect"
  | "en_evaluation"
  | "valide"
  | "signe"
  | "refuse";

export type StatutProjet =
  | "prospection"
  | "en_cours"
  | "ouvert"
  | "suspendu"
  | "abandonne";

export type StatutEtape = "a_faire" | "en_cours" | "fait" | "en_retard" | "na";

export type ResponsableEtape = "franchise" | "mc" | "externe" | "les_deux";

export type PhaseEtape =
  | "administratif_financement"
  | "communication"
  | "ressources_humaines"
  | "travaux_amenagement"
  | "formation"
  | "stock_fournisseurs"
  | "ouverture";

export type Ville = {
  id: string;
  nom: string;
  departement: string | null;
  region: string | null;
  population: number | null;
  statut: StatutVille;
  notes: string | null;
  created_at: string;
};

export type Candidat = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  apport_personnel: number | null;
  zone_souhaitee: string | null;
  statut: StatutCandidat;
  notes: string | null;
  profil_id: string | null;
  created_at: string;
};

export type Projet = {
  id: string;
  nom: string;
  type_magasin: TypeMagasin;
  format_magasin: FormatMagasin;
  statut: StatutProjet;
  ville_id: string | null;
  candidat_id: string | null;
  franchisee_id: string | null;
  date_cible_ouverture: string | null;
  date_ouverture_reelle: string | null;
  surface_m2: number | null;
  lien_sharepoint: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type EtapeTemplate = {
  id: string;
  phase: PhaseEtape;
  nom: string;
  description: string | null;
  ordre: number;
  delai_semaines: number | null;
  responsable: ResponsableEtape;
};

export type FranchiseAsssocie = {
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
};

export type Franchise = {
  id: string;
  nom: string;
  raison_sociale: string | null;
  siren: string | null;
  rcs: string | null;
  tva_intracom: string | null;
  associes: FranchiseAsssocie[];
  notes: string | null;
  archive: boolean;
  created_at: string;
  updated_at: string;
};

export type Magasin = {
  id: string;
  nom: string;
  type: "integre" | "franchise";
  franchise_id: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  telephone: string | null;
  email: string | null;
  date_signature_contrat: string | null;
  date_ouverture: string | null;
  format: FormatMagasin | null;
  surface_m2: number | null;
  notes: string | null;
  archive: boolean;
  date_fermeture: string | null;
  projet_id: string | null;
  created_at: string;
  updated_at: string;
};

export type MagasinSiret = {
  id: string;
  magasin_id: string;
  siret: string;
  date_debut: string;
  date_fin: string | null;
  created_at: string;
};

export type TypeCession = "franchise_a_franchise" | "integre_a_franchise" | "franchise_a_integre";

export type MagasinCession = {
  id: string;
  magasin_id: string;
  date_cession: string;
  type_cession: TypeCession;
  franchise_cedant_id: string | null;
  franchise_repreneur_id: string | null;
  nouveau_siret: string | null;
  notes: string | null;
  created_at: string;
};

export type MCUser = {
  id: string;
  nom: string;
  prenom: string;
  role: UserRole;
  fonction: string | null;
};

export type EtapeProjet = {
  id: string;
  projet_id: string;
  template_id: string | null;
  phase: PhaseEtape;
  nom: string;
  responsable: ResponsableEtape;
  resp_mc: string[] | null; // uuid[] en base
  resp_franchise: string | null;
  resp_externe: string | null;
  ordre: number;
  statut: StatutEtape;
  date_cible: string | null;
  date_realisation: string | null;
  lien_document: string | null;
  commentaire: string | null;
  created_at: string;
  updated_at: string;
};

export type Commentaire = {
  id: string;
  projet_id: string;
  etape_id: string | null;
  auteur_id: string;
  contenu: string;
  created_at: string;
};

// Labels d'affichage

export const FORMAT_LABELS: Record<FormatMagasin, string> = {
  classique: "Magasin classique",
  galerie: "Galerie (cellule)",
  centre_ville: "Centre-ville",
  kiosque: "Kiosque",
  shop_in_shop: "Shop-in-shop",
};

export const TYPE_LABELS: Record<TypeMagasin, string> = {
  integre: "Intégré",
  franchise: "Franchisé",
};

export const STATUT_PROJET_LABELS: Record<StatutProjet, string> = {
  prospection: "Prospection",
  en_cours: "En cours",
  ouvert: "Ouvert",
  suspendu: "Suspendu",
  abandonne: "Abandonné",
};

export const STATUT_VILLE_LABELS: Record<StatutVille, string> = {
  en_etude: "En étude",
  validee: "Validée",
  abandonnee: "Abandonnée",
};

export const STATUT_CANDIDAT_LABELS: Record<StatutCandidat, string> = {
  prospect: "Prospect",
  en_evaluation: "En évaluation",
  valide: "Validé",
  signe: "Signé",
  refuse: "Refusé",
};

export const STATUT_ETAPE_LABELS: Record<StatutEtape, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  fait: "Fait",
  en_retard: "En retard",
  na: "N/A",
};

export const PHASE_LABELS: Record<PhaseEtape, string> = {
  administratif_financement: "Administratif & Financement",
  communication: "Communication",
  ressources_humaines: "Ressources humaines",
  travaux_amenagement: "Travaux, Aménagement & Mobilier",
  formation: "Formation",
  stock_fournisseurs: "Stock & Fournisseurs",
  ouverture: "Ouverture",
};
