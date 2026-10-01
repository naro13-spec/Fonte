# Fonte

Ton carnet de musculation à la maison : séances guidées, minuteur de repos, historique, matériel. Fonctionne **hors ligne**, **sans compte**, et **rien ne quitte ton appareil**.

Version 1.0 (MVP). La course à pied n'est volontairement pas dans l'application.

## Ce que contient le MVP

- Séance du jour, séance en cours (saisie en quelques gestes, repos automatique réglable, correction de la série précédente, reprise si l'application se ferme)
- Programme A / B / C / D réglable, déplacement d'une séance pour la semaine avec avertissement de récupération
- Bibliothèque de 32 exercices qui suit ton matériel, avec fiches et consignes de sécurité
- Équipement : l'ajout d'une barre de traction, d'élastiques, d'un banc ou d'haltères débloque les exercices
- Historique, export et import de sauvegarde, effacement complet

Les suggestions de progression, la récupération, les objectifs, les graphiques et le calendrier arrivent dans l'étape suivante.

## Mettre l'application en ligne (sans rien installer)

Aucun outil à installer : l'application est faite de fichiers simples, qu'il suffit d'héberger.

1. Crée un compte gratuit sur **github.com**. Choisis un pseudo qui ne contient pas ton vrai nom.
2. Clique sur **New repository**. Nom : `fonte`. Choisis **Public** (obligatoire pour l'hébergement gratuit). Clique sur **Create repository**.
3. Clique sur **uploading an existing file**. Décompresse le dossier reçu, puis **glisse tout son contenu** (index.html, sw.js, les dossiers `js`, `css`, `icons`…) dans la page. Clique sur **Commit changes**.
4. Va dans **Settings → Pages**. Sous **Branch**, choisis `main` et le dossier `/ (root)`, puis **Save**.
5. Après une minute, ton application est disponible à l'adresse `https://TON-PSEUDO.github.io/fonte/`.

Aucune donnée personnelle ne se trouve dans les fichiers : tes séances restent dans ton navigateur.

## L'installer sur ta tablette Android

Ouvre l'adresse dans **Chrome**, ouvre le menu (les trois points), puis **Installer l'application**. Elle apparaît ensuite comme une application normale.
Pour vérifier le mode hors ligne : ouvre l'application une première fois avec Internet, puis passe en mode avion et relance-la.

## Si l'écran reste noir ou vide

Depuis la version 1.0.1, Fonte affiche un message explicatif au bout de 5 secondes s'il ne démarre pas. Dans tous les cas :

1. Recharge sans le cache : **Ctrl + Maj + R** (ordinateur).
2. Ouvre `https://TON-PSEUDO.github.io/fonte/js/main.js`. Tu dois voir du code. Si tu vois « 404 », le dossier `js` n'est pas au bon endroit dans le dépôt : `js/main.js` doit exister à la racine.
3. Vérifie que **tous** les sous-dossiers (`js/app`, `js/data`, `js/domain`, `js/ui`) ont bien été envoyés.
4. Ouvre la console (touche F12, onglet Console) et note le texte en rouge.

## Sauvegarder tes données

Tes données sont stockées sur l'appareil, dans le navigateur. Si tu vides les données du navigateur, elles disparaissent.
Utilise régulièrement **Réglages → Exporter mes données** et garde le fichier. Pour passer d'un appareil à l'autre, exporte sur le premier, importe sur le second.
Les données sont liées à l'adresse du site : si l'adresse change, exporte avant de changer.

## Mettre à jour l'application

1. Remplace les fichiers modifiés dans le dépôt (même glisser-déposer).
2. Change le numéro de version à **deux endroits** : `VERSION` dans `sw.js` et dans `js/version.js` (les mêmes chiffres).
3. Si tu ajoutes ou renommes un fichier, ajoute-le à la liste `CORE` de `sw.js`.

Ces trois règles sont vérifiées par les tests (voir ci-dessous). La nouvelle version s'active au lancement suivant, jamais pendant une séance.

## Tests (facultatif)

Avec Node 20 ou plus : `node --test`. Aucun paquet à installer. Les tests couvrent le matériel, la planification, la séance, la persistance, les migrations, l'import/export, un parcours complet de l'application et la cohérence du mode hors ligne.
Si tu mets le projet sur GitHub, le fichier `.github/workflows/tests.yml` les lance automatiquement à chaque modification.

## Aperçu en un seul fichier

`node tools/bundle.mjs . dist/fonte-preview.html` assemble toute l'application en un fichier unique, pratique pour un essai rapide. Cet aperçu n'a pas de mode hors ligne.

## Documentation

- `docs/architecture.md` : structure du code et décisions
- `docs/design.md` : couleurs, typographies, et comment ajouter une police auto-hébergée

## Avertissement

Fonte n'est pas un avis médical et ne remplace pas un coach qualifié. En cas de douleur vive, persistante ou inhabituelle, arrête l'exercice et parles-en à un parent ou tuteur, ou à un professionnel de santé.
