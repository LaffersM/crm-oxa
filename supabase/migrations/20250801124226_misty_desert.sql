/*
  # Ajout d'articles de démonstration au catalogue

  1. Nouveaux articles
    - 6 articles représentatifs du domaine de la décarbonation industrielle
    - Répartis sur les différents types : IPE, ELEC, MATERIEL, MAIN_OEUVRE
    - Prix cohérents avec le marché de l'efficacité énergétique
    - Descriptions détaillées pour faciliter l'utilisation

  2. Données incluses
    - Récupérateurs de chaleur
    - Équipements électriques
    - Matériel d'isolation
    - Services d'installation et maintenance
    - Prix d'achat et de vente réalistes
    - TVA à 20% par défaut
*/

-- Insertion des articles de démonstration
INSERT INTO articles (
  nom,
  description,
  type,
  prix_achat,
  prix_vente,
  tva,
  unite,
  actif
) VALUES 
(
  'Récupérateur de chaleur air-air haute performance',
  'Système de récupération de chaleur sur air vicié avec échangeur à plaques, rendement > 85%, débit 5000 m³/h. Conforme aux exigences CEE fiche IND-UT-134.',
  'IPE',
  8500.00,
  12500.00,
  20.00,
  'unité',
  true
),
(
  'Variateur de fréquence industriel 45kW',
  'Variateur électronique de vitesse pour moteurs asynchrones, puissance 45kW, protection IP54, interface Modbus. Économies d''énergie jusqu''à 30%.',
  'ELEC',
  2800.00,
  4200.00,
  20.00,
  'unité',
  true
),
(
  'Isolation thermique haute température',
  'Panneaux d''isolation thermique pour conduites et équipements industriels, température max 400°C, épaisseur 100mm, lambda 0.035 W/m.K.',
  'MATERIEL',
  45.00,
  75.00,
  20.00,
  'mètre carré',
  true
),
(
  'Installation et mise en service équipements',
  'Prestation d''installation, raccordement, paramétrage et mise en service des équipements de récupération d''énergie. Inclut formation utilisateur.',
  'MAIN_OEUVRE',
  0.00,
  850.00,
  20.00,
  'jour',
  true
),
(
  'Échangeur thermique à plaques brasées',
  'Échangeur thermique compact pour récupération de chaleur sur fluides, puissance 150kW, température max 180°C, acier inoxydable 316L.',
  'MATERIEL',
  3200.00,
  5500.00,
  20.00,
  'unité',
  true
),
(
  'Audit énergétique et étude de faisabilité CEE',
  'Audit énergétique complet avec calcul des économies d''énergie, étude de faisabilité CEE, rapport détaillé et accompagnement administratif.',
  'MAIN_OEUVRE',
  0.00,
  2500.00,
  20.00,
  'forfait',
  true
);