-- Peuplement du template de retroplanning : les 33 tâches standard extraites
-- des retroplannings Bayonne et Urrugne.
-- delai_semaines : semaines avant la date d'ouverture (négatif). Null = à définir.

insert into public.etapes_template (phase, nom, ordre, delai_semaines, responsable) values

-- ---------------------------------------------------------------------------
-- ADMINISTRATIF & FINANCEMENT
-- ---------------------------------------------------------------------------
('administratif_financement', 'Signature contrat de licence de marque',  1, null,  'franchise'),
('administratif_financement', 'Dépôt de capital',                         2, -12,   'franchise'),
('administratif_financement', 'Signature du bail',                         3, null,  'franchise'),
('administratif_financement', 'Règlement des frais commercialisateur',     4, null,  'franchise'),
('administratif_financement', 'Règlement des frais d''accompagnement franchise', 5, -12, 'franchise'),
('administratif_financement', 'Déclaration préfecture vente occasion',     6, null,  'franchise'),
('administratif_financement', 'Signature du devis mobilier',               7, -12,   'franchise'),
('administratif_financement', 'Règlement de l''acompte mobilier',          8, -12,   'franchise'),

-- ---------------------------------------------------------------------------
-- COMMUNICATION
-- ---------------------------------------------------------------------------
('communication', 'Création des supports de communication',               9,  -11,  'mc'),
('communication', 'Ouverture des comptes Mediaclinic (RS et Google)',     10,  -11,  'mc'),
('communication', 'Installation des vitrophanies de travaux',             11,  -11,  'mc'),
('communication', 'Communication d''ouverture',                           12,   -2,  'mc'),

-- ---------------------------------------------------------------------------
-- RESSOURCES HUMAINES
-- ---------------------------------------------------------------------------
('ressources_humaines', 'Lancement des campagnes de recrutement',        13,  -11,  'mc'),
('ressources_humaines', 'Entretiens',                                     14,  -10,  'franchise'),
('ressources_humaines', 'Validation des recrutements',                    15,   -9,  'franchise'),

-- ---------------------------------------------------------------------------
-- TRAVAUX, AMÉNAGEMENT & MOBILIER
-- ---------------------------------------------------------------------------
('travaux_amenagement', 'Travaux en cours',                               16,  -10,  'franchise'),
('travaux_amenagement', 'Finalisations des travaux',                      17,   -3,  'franchise'),
('travaux_amenagement', 'Aménagement et nettoyage',                       18,   -2,  'franchise'),
('travaux_amenagement', 'Installation électrique (électricien)',          19,   -2,  'externe'),
('travaux_amenagement', 'Fabrication mobilier',                           20,  -10,  'externe'),
('travaux_amenagement', 'Livraison mobilier',                             21,   -2,  'externe'),
('travaux_amenagement', 'Installation mobilier',                          22,   -2,  'franchise'),
('travaux_amenagement', 'Livraison des consommables',                     23,   -2,  'mc'),

-- ---------------------------------------------------------------------------
-- FORMATION
-- ---------------------------------------------------------------------------
('formation', 'Formation concept',                                        24,   -6,  'mc'),
('formation', 'Formation technique Niveau 1',                             25,   -6,  'mc'),
('formation', 'Formation technique Niveau 2',                             26,   -3,  'mc'),

-- ---------------------------------------------------------------------------
-- STOCK & FOURNISSEURS
-- ---------------------------------------------------------------------------
('stock_fournisseurs', 'Ouverture des comptes fournisseurs',             27,   -4,  'mc'),
('stock_fournisseurs', 'Commandes de stock finales',                     28,   -2,  'mc'),
('stock_fournisseurs', 'Livraison des consommables',                     29,   -2,  'mc'),
('stock_fournisseurs', 'Livraison et encodages du stock',                30,   -2,  'mc'),

-- ---------------------------------------------------------------------------
-- OUVERTURE
-- ---------------------------------------------------------------------------
('ouverture', 'Pré-ouverture technique',                                 31,   -1,  'franchise'),
('ouverture', 'Pré-ouverture technique J-1',                             32,   -1,  'franchise'),
('ouverture', 'Ouverture du magasin',                                    33,    0,  'franchise');
