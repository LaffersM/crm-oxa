# OXA Groupe CRM - Application de Gestion Commerciale

Une application web professionnelle de gestion commerciale (CRM) destinée à OXA Groupe, spécialisée dans la décarbonation industrielle.

## 🚀 Fonctionnalités

### CRM Complet
- **Gestion des prospects** : Suivi des prospects avec statuts et sources
- **Gestion des clients** : Base clients complète avec coordonnées et historique
- **Authentification sécurisée** : Système de rôles (admin, commercial)

### Gestion Commerciale
- **Devis** : Création, modification et suivi des devis avec numérotation automatique
- **Commandes** : Conversion des devis en commandes
- **Factures** : Génération de factures avec calculs automatiques
- **Catalogue** : Gestion des articles et fournisseurs

### Calculateur CEE Intégré
- **Calcul selon IND UT 134** : Formule standardisée pour les primes CEE
- **Interface intuitive** : Calcul automatique des kWh cumac et primes
- **Sauvegarde** : Historique des calculs réalisés

### Tableau de Bord
- **Statistiques en temps réel** : CA, marges, primes CEE
- **Graphiques interactifs** : Évolution mensuelle et répartition
- **Indicateurs clés** : Suivi des performances commerciales

## 🛠️ Technologies Utilisées

- **Frontend** : React 18, TypeScript, Tailwind CSS
- **Backend** : Supabase (PostgreSQL, Auth, Storage)
- **Graphiques** : Recharts
- **PDF** : jsPDF + html2canvas
- **Icônes** : Lucide React

## 📦 Installation

### Prérequis
- Node.js (v18 ou supérieur)
- Compte Supabase

### Configuration Supabase

1. **Créer un projet Supabase**
   - Rendez-vous sur [supabase.com](https://supabase.com)
   - Créez un nouveau projet nommé `oxa-groupe-crm`
   - Notez l'URL du projet et la clé publique

2. **Configurer la base de données**
   - Exécutez le script SQL `supabase/migrations/create_schema.sql`
   - Activez l'authentification par email/mot de passe
   - Désactivez la confirmation d'email

3. **Variables d'environnement**
   ```bash
   cp .env.example .env
   ```
   
   Remplissez le fichier `.env` :
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### Installation locale

```bash
# Cloner le projet
git clone <repository-url>
cd oxa-groupe-crm

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

## 🔧 Configuration

### Authentification
- Créez un premier utilisateur via l'interface d'inscription
- Modifiez son rôle en 'admin' directement dans Supabase
- Les nouveaux utilisateurs ont le rôle 'commercial' par défaut

### Paramètres CEE
- Tarif par défaut : 0,002 €/kWh cumac
- Modifiable dans l'interface du calculateur
- Basé sur la fiche standardisée IND UT 134

## 📊 Utilisation

### Tableau de Bord
- Vue d'ensemble des activités commerciales
- Statistiques temps réel
- Graphiques de performance

### Calculateur CEE
- Saisie des paramètres (puissance, activité, durée)
- Calcul automatique selon la formule : `kWh cumac = 29.4 × coeff × P × F`
- Estimation de la prime CEE
- Sauvegarde des calculs

### Gestion Commerciale
- Workflow complet : Prospect → Client → Devis → Commande → Facture
- Numérotation automatique
- Calcul des marges et totaux
- Génération de PDF

## 🎨 Design

Interface moderne inspirée des standards OXA Groupe :
- **Couleurs** : Palette bleue professionnelle
- **Typographie** : Polices lisibles et hiérarchisées
- **Responsive** : Optimisé pour tous les écrans
- **Accessibilité** : Contraste et navigation au clavier

## 📈 Évolutions Futures

- **Génération PDF** : Devis et factures aux couleurs OXA
- **Envoi d'emails** : Notification automatique des clients
- **Rapports avancés** : Analyses de performance détaillées
- **API intégrations** : Synchronisation avec outils externes
- **Mobile app** : Application mobile native

## 🤝 Support

Pour toute question ou problème :
- Consultez la documentation Supabase
- Vérifiez les logs dans la console navigateur
- Contactez l'équipe de développement

## 📄 License

© 2024 OXA Groupe. Tous droits réservés.

---

**Note importante** : Cette application est configurée pour fonctionner avec Supabase. Assurez-vous de bien configurer votre projet Supabase avant de démarrer l'application.