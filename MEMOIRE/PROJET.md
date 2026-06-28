# MÉMOIRE DU PROJET — École de Médecine 1904 · Reckless RP

---

## Informations essentielles

| Clé | Valeur |
|-----|--------|
| Repo principal (joueurs) | https://github.com/Tamalou70500/Psy.git |
| Repo redesign (dev) | https://github.com/Tamalou70500/Psy2.git |
| Site joueurs en ligne | https://tamalou70500.github.io/Psy/ |
| Site dev en ligne | https://tamalou70500.github.io/Psy2/ |
| Firebase projet | psy-redm |
| Dossier local | D:\SITE WEB\Docteur 1904\Psy-main\Psy-main\ |
| Images bureau | D:\SITE WEB\Docteur 1904\photo\ → copié dans images/desk/ |

---

## Architecture du projet

```
Psy-main/
├── index.html          → Page d'accueil publique (déjà bien, hero + sections)
├── login.html          → Connexion Firebase
├── dossier_patient.html → Bureau immersif PC + liste mobile
├── patient.html        → Fiche d'un patient individuel
├── lexique.html        → Dictionnaire médical (62 entrées)
├── cours.html          → Cours et spécialisations
├── examen.html         → Examens
├── communaute.html     → Mur communautaire
├── profil.html         → Profil + choix thème/police
├── frise.html          → Frise chronologique
├── mediatheque.html    → Médiathèque
├── admin.html          → Panneau admin
├── css/
│   └── style.css       → Design system complet (1995 lignes)
├── js/
│   ├── header.js       → Navbar injectée sur toutes les pages
│   ├── guard.js        → Protection des pages (auth)
│   ├── auth-firebase.js→ Authentification
│   └── patients.js     → CRUD patients Firestore
└── images/
    └── desk/           → Images pour le bureau immersif
```

---

## Système de thèmes (profil utilisateur)

Les utilisateurs choisissent leur thème dans profil.html.
Stocké dans `localStorage` → appliqué via `data-theme` sur `<html>`.

| Thème | Fond | Accent |
|-------|------|--------|
| dark (défaut) | Noir encre | Or ambré |
| parchment | Crème ivoire | Or brun |
| day | Blanc | Bleu acier |
| urgence | Noir profond | Rouge sang |
| cabinet | Vert clair | Vert forêt |

**Important** : tout CSS doit utiliser les variables (`--ink`, `--gold`, `--parch`, `--bdr`…) jamais de couleurs hardcodées — sinon les thèmes ne fonctionnent plus.

---

## Polices disponibles

| ID | Nom | CSS |
|----|-----|-----|
| victorien | Victorien | Playfair Display + EB Garamond |
| medical | Médical | Libre Baskerville + Source Serif Pro |
| + autres | … | … |

---

## Vision du redesign 2026

### Concept général
Chaque section a sa propre **scène immersive** sur PC.
Le mobile reste propre et lisible (pas d'image lourde).

### Pages et leur scène

#### 🗂 Dossiers patients — VALIDÉ PAR LE CLIENT ✅✅
- **PC** : Bureau médecin 1900 en fond plein écran. Objets posés (lampe, stéthoscope, loupe, montre, encrier, scalpel). Dossier ouvert au centre avec fiches patients à l'intérieur. Tampon rouge animé au chargement.
- **Mobile** : Liste propre avec initiales + badges statut. Bouton + flottant.
- **Images utilisées** : Le fond principal.png uniquement en fond (objets retirés = trop chargé)
- **Dossier ouvert.png** : réservé pour patient.html (ouverture du dossier individuel)
- **Couleurs** : 100% variables CSS — compatible tous thèmes (dark/parchemin/urgence/cabinet/jour)
- **Résultat** : MAGNIFIQUE selon le client — fond immersif + panneau glassmorphism

#### 📖 Dictionnaire — EN COURS 🔧
- **PC** : Fond = bibliothèque victorienne ou table de lecture avec livre ouvert. Panneau glassmorphism (même approche que Dossiers, validée). Page gauche = index alphabétique. Page droite = entrée + illustration Wikimedia.
- **Mobile** : Une entrée à la fois, fond sobre, navigation par filtres.
- **Leçon Dossiers** : fond seul sans objets décoratifs, panneau glassmorphism, 100% variables CSS
- **Images à générer** :
  - Fond principal : livre médical ouvert sur table de lecture victorienne, vue de dessus, lumière chaude
  - Variante : bibliothèque victorienne avec étagères et livre ouvert au centre
- **Prompts envoyés au client** : ✅ 28 juin 2026

#### 🎓 Cours — À FAIRE
- **PC** : Fond amphithéâtre médical victorien. Contenu sur tableau noir, typographie chalk. Modules = cahiers posés sur un pupitre. Animation écriture à la craie au chargement.
- **Mobile** : Liste par spécialisation, progression visible.
- **Images à créer** : Amphithéâtre 1900, tableau noir

#### 📝 Examens — À FAIRE
- **PC** : Fond salle d'examen 1900. Feuille blanche sur sous-main vert au centre. En-tête officiel gravé. Cachet rouge animé à la validation.
- **Mobile** : Questionnaire plein écran, une question à la fois, barre de progression.
- **Images à créer** : Salle d'examen, feuille d'examen, encrier + plume

---

## Éléments communs (à implémenter)

- **Navigation PC** : Menu latéral gauche style tranche de livre (rétractable)
- **Navigation mobile** : Barre de navigation en bas (5 icônes)
- **Transitions** : Fondu au noir entre les sections
- **Thèmes** : Images de fond adaptées via filtre CSS sepia+tint selon thème actif

---

## Images disponibles (images/desk/)

| Fichier | Usage |
|---------|-------|
| Le fond principal .png | Fond bureau PC — Dossiers |
| dossier ouvert.png | Pochette dossier ouverte |
| dossier fermer.png | Pochette dossier fermée (animation future) |
| tampon.png | Cachet rouge DOSSIER |
| lampehuile.png | Objet décoratif bureau |
| stetoscope.png | Objet décoratif bureau |
| montre.png | Objet décoratif bureau |
| loupe.png | Objet décoratif bureau |
| encrier.png | Objet décoratif bureau |
| scalpel.png | Objet décoratif bureau |
| flacon.png | Objet décoratif (à placer) |
| papierparchemin.png | Texture papier (à utiliser) |
| icone de dossier medaical.png | Icône menu |

---

## Dictionnaire médical

- **62 entrées** réparties en 5 catégories : psy, chir, mal, rem, exam
- Structure : `{ term, sub, cat, label, def, symptomes, traitement, steps[], epoch }`
- Images Wikimedia via `https://en.wikipedia.org/wiki/Special:FilePath/FILENAME`
- Layout 2 colonnes : texte gauche + illustration droite (grid-template-columns: 1fr 170px)

---

## Commandes Git utiles

```bash
# Pousser vers Psy2 (site de dev)
git push psy2 main

# Pousser vers Psy (site joueurs)
git push origin main

# Voir les remotes
git remote -v
```

---

## Prochaines étapes

1. [ ] Tester la page Dossiers sur Psy2 et ajuster
2. [ ] Générer images pour le Dictionnaire (livre ouvert, parchemin)
3. [ ] Reconstruire lexique.html — livre immersif
4. [ ] Générer images pour les Cours (amphithéâtre, tableau noir)
5. [ ] Reconstruire cours.html — salle de classe
6. [ ] Générer images pour les Examens (salle, feuille, sous-main)
7. [ ] Reconstruire examen.html — salle d'examen
8. [ ] Navigation latérale PC + barre mobile
9. [ ] Transitions entre pages
10. [ ] Valider → merger Psy2 vers Psy (site joueurs)
