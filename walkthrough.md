# Walkthrough — Implémentation d'Aymard Store

Aymard Store est une application e-commerce moderne inspirée d'Alibaba.com, développée en Next.js, supportant le changement de langue, la conversion de devises (EUR/FCFA), la gestion de paniers, l'espace client et un tableau de bord d'administration complet.

---

## 🛠️ Fonctionnalités Implémentées

### 1. 🎨 Design System Premium & Interactions 3D Physical
- **Fichier** : [globals.css](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/app/globals.css)
- **Identité Typographique Streetwear Hype** : Intégration de la police expressive **Space Grotesk** pour les titres et la marque, et **Outfit** pour le corps du texte.
- **3D Interaction Engine** :
  - **3D Hover Tilt** : Les fiches produits s'inclinent en 3D (`perspective` et `rotate`) en fonction de l'interaction avec le curseur.
  - **Bouton Tactile Click** : Les boutons ont un biseau 3D (`border-bottom`) de 4px qui s'enfonce de manière réaliste à la pression (`:active`).
  - **Mega Menu Fold** : Les grands menus déroulants se déploient avec un effet de pli 3D rotatif.
- **Debounce Hover Navigation** : Un délai d'amortissement de 250ms a été ajouté sur la navigation pour éviter la fermeture intempestive des menus déroulants lors du transit de la souris.

### 2. 📱 Refonte Responsives Mobile & UX
- **Header & Logo Responsives** : Remplacement des hauteurs de logo fixes (`130px`) qui débordaient sur mobile par une classe réactive `.header-logo-img` :
  - *Ordinateur* : `130px`
  - *Tablette* : `100px`
  - *Mobile* : `54px` (hauteur parfaitement proportionnée au header mobile de `64px`).
- **Grilles E-Commerce fluides** : 
  - **Fiche Produit (Product Details)** : Remplacement de la grille inline fixe (`minmax(420px, 1fr)`) par la classe `.product-detail-grid` qui empile les éléments sur une seule colonne sur mobile et se sépare en 2 colonnes sur tablette/desktop.
  - **Grille de Collection (Catalog Grid)** : Suppression des styles de grille inline qui forçaient 1 seule colonne géante sur mobile. La classe `.grid-3` gère désormais dynamiquement un affichage à **2 colonnes sur mobile** (standard e-commerce) et 3 colonnes sur desktop.
  - **Fiches d'atouts (Specs Grid)** : Les atouts d'expédition et d'authenticité s'empilent proprement sur une seule ligne verticale sur mobile.
  - **Sidebar de filtres** : S'élargit à `100%` de la largeur de l'écran sur mobile pour s'intégrer harmonieusement dans le flux vertical.

### 3. ⚡ Écrans de Transition & Pré-chargements (Splash Screens)
- **Cinematic Pre-loader (Premier accès au site)** :
  - **Fichier** : [Header.tsx](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/components/layout/Header.tsx)
  - Intégration d'un pré-chargeur de session. Lorsqu'un client visite le site pour la première fois (à l'ouverture de l'onglet), il est accueilli par la transition cinématique 3D pendant **2,2 secondes** avant d'accéder à l'accueil.
  - Utilise `sessionStorage` pour se souvenir du passage et ne pas interrompre l'expérience de navigation lors des visites suivantes.
- **Authentification Submit Pre-loader (Validation de connexion)** :
  - **Fichier** : [page.tsx](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/app/auth/login/page.tsx)
  - Lorsque le client soumet le formulaire de connexion (bouton *Se connecter*), l'écran de transition 3D s'active en fondu de manière progressive, affiche la marque animée et effectue la redirection sécurisée vers son espace client ou admin après 2 secondes.
- **Splash Screen Intercepteur de Navigation** : Intercepte les clics sur l'icône de compte (desktop) et le lien de compte (tiroir mobile) pour afficher un magnifique écran de transition plein écran.
- **Automate d'état fluide (State Machine)** : Transition fluide en 4 étapes (Render -> Fade-In -> Transition -> Fade-Out & Unmount) pour éliminer les micro-saccades. Le fond de la page active se floute et s'assombrit de manière progressive (`backdrop-filter: blur(20px)`).
- **Cinematic 3D Logo Reveal** : Le logo Aymard Store s'anime avec un zoom dynamique descendant de `1.25` to `1.0`, une rotation 3D douce et inclinée, et un balayage de lumière blanche scintillante (`shineSweep` mix-blend-mode overlay) qui glisse sur les lettres comme une réflexion lumineuse.
- **Branding "GlobalGest"** : La mention **« PROPULSÉ PAR GLOBALGEST »** est intégrée au bas de l'écran avec une typographie épurée et espacée.

### 4. 👟 Fiche Produit SNKRS-Style Ultra-Premium
- **Fichier** : [page.tsx](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/app/products/[slug]/page.tsx)
- **Frameless Image Showcase** : Remplacement des cadres fermés par un affichage sans bordures où le produit flotte sur une aura de lumière colorée (halo de dégradé radial flouté) avec une ombre au sol réaliste.
- **3D Cursor Tilt** : L'image principale réagit en temps réel en s'inclinant dynamiquement selon les mouvements de la souris.
- **Breathing Animation** : L'image flotte doucement en continu pour donner une impression de vie.
- **Compteur de Visites Fluctuant** : Un compteur dynamique simulé affiche le nombre de visiteurs en direct et fluctue de +/- 3 personnes toutes les 4 secondes pour inciter à l'achat.
- **Color Swatches Visuels** : Remplacement du sélecteur textuel par des bulles de couleurs intégrant des pastilles colorées correspondant au coloris du produit.
- **Grille technique & Tiroirs** : Ajout d'une grille de garanties de livraison/retour et de volets accordéons (description, livraison, détails) fluides.

### 5. 🛡️ Tableau de Bord Admin GlobalGest-Style Overhaul (Gestion Intégrale)
- **Fichier** : [page.tsx](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/app/admin/page.tsx)
- **Dedicated Full-Screen Portal** : Intégration d'une règle CSS globale `:has()` masquant automatiquement la barre supérieure, l'en-tête public et le pied de page du magasin lorsque le panneau d'administration est monté.
- **Corporate Left Navigation Sidebar** : Une barre latérale noir pur (`#000000`) streetwear, affichant le logo d'Aymard Store sur fond blanc, et des boutons d'onglets réactifs (`Accueil`, `Produits`, `Ventes`, `Configuration`, etc.) s'activant en blanc vif (`#ffffff`) avec texte noir (`#000000`).
- **Context Search & Header Bar** : En-tête blanc épuré avec sélecteur de magasin actif (`AYMARD STORE (PRINCIPAL)`), cloche de notification dotée d'un badge noir affichant `27` alertes, et menu déroulant utilisateur personnalisé pour **Jude**.
- **Real-Time Insight Filters Card** : Un bloc complet de filtrage d'activité avec indicateur de statut pulsing vert (`Données en temps réel`), et sélecteurs de date de début / fin d'analyse de données.
- **Dynamic Metrics Glassmorphic Cards** : Cartes translucides intégrées au bandeau noir principal, reportant dynamiquement le chiffre d'affaires cumulé (en EUR ou converti en FCFA selon la devise choisie) et le volume de commandes reçues.
- **Nouvel Onglet `Configuration` (Gestion Intégrale sitewide)** :
  - **Taux de Change Dynamique** : Zone de saisie pour modifier le taux de conversion 1 EUR ➔ FCFA. La valeur configurée est répercutée en temps réel partout sur le site public pour tous les calculs de prix.
  - **Frais de Port Gratuits** : Zone de saisie pour modifier le seuil de gratuité de livraison. La valeur est prise en compte dans le panier et dans la barre supérieure TopBar.
  - **Bandeau d'annonces** : Éditeur de liste permettant d'ajouter ou de supprimer des messages textuels défilant dans la TopBar publique.
  - **Gestion des Codes de Réduction** : Outil pour créer et supprimer des codes promos (rabais fixe en EUR ou pourcentage), applicables par les clients lors de la validation du panier.
- **Gestion Interactive des Commandes** : Menu déroulant pour modifier le statut d'une commande (`EN ATTENTE`, `EXPÉDIÉE`, `LIVRÉE`), avec enregistrement immédiat.

### 6. ⚡ État Global & Persistance (Zustand Store)
- **Fichier** : [store.ts](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/lib/store.ts)
- Gère le panier de commande, les favoris (wishlist), la langue active (`fr` / `en` / `es`), la devise active (`EUR` / `FCFA` avec taux de conversion dynamique), le profil de session utilisateur, le journal des commandes, et désormais **la base de données produits dynamique, les codes promos et les configurations système**.
- Utilise le middleware de persistance pour sauvegarder l'état dans le `localStorage` du navigateur.

### 7. 🌐 Internationalisation (i18n)
- **Fichiers de traduction** : 
  - [fr.json](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/messages/fr.json)
  - [en.json](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/messages/en.json)
  - [es.json](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/messages/es.json)
- **Helper** : [i18n.ts](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/lib/i18n.ts) (Permet de charger dynamiquement et de traduire instantanément les clés du dictionnaire).

### 8. 🏢 Layout Principal & Composants Communs
- **TopBar** : [TopBar.tsx](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/components/layout/TopBar.tsx) (Sélecteur de langue avec drapeaux et devise €/FCFA, bandeaux d'annonces dynamiques).
- **Header** : [Header.tsx](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/components/layout/Header.tsx) (Barre de recherche fonctionnelle avec sélecteur de catégorie, accès compte/favoris/panier avec badge, méga-menus déroulants animés en 3D sur toute la ligne).
- **Footer** : [Footer.tsx](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/components/layout/Footer.tsx) (Newsletter, liens utiles et badges de paiement sécurisé).

### 9. 🏠 Pages E-Commerce Principales
- **Accueil** : [page.tsx](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/app/page.tsx) (Rassemble HeroCarousel, CategoryGrid, FeaturedProducts, TopRanking, NewArrivals et TrustBadges, connectée à la base de données dynamique).
- **Catalogue de produits** : [page.tsx](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/app/products/page.tsx) (Filtres interactifs par catégorie, prix, promo, nouveauté et tri, connectée à la base de données dynamique).

### 10. 🔐 Authentification & Espace Client
- **Formulaire de Connexion** : [page.tsx](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/app/auth/login/page.tsx)
  - Admin Credentials : `judesinaberogui@gmail.com` / `Mercredi12@`.
  - Connexion automatique en tant que client pour toute autre adresse email.
- **Formulaire d'Inscription** : [page.tsx](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/app/auth/register/page.tsx)
- **Espace Client** : [page.tsx](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/app/account/page.tsx) (Historique de commandes, statuts, récapitulatifs).
- **Wishlist** : [page.tsx](file:///c:/Users/HP/OneDrive/Desktop/aymard-store/app/account/favorites/page.tsx) (Grille de produits favoris).
