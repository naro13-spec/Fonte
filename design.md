# Design de Fonte

## Jetons

Définis dans `css/tokens.css`. Fond **graphite** `#121317`, surfaces **acier** `#1A1C21` et `#23262C`, accent **cobalt** `#7C93FF` avec texte sombre `#0B1030` dessus.
États : réussi `#58C98A`, attention (sécurité, douleur) `#F08A5D`, erreur technique `#E5636F`. Une information n'est jamais portée par la couleur seule.

## Règles

- Un seul bouton principal par écran, en accent.
- Zones tactiles : 48 px minimum, 56 à 64 px en séance.
- Les animations confirment une action (plaque qui se remplit, anneau du repos). `prefers-reduced-motion` est respecté.
- Les alertes de sécurité sont orange, jamais rouges. Le rouge est réservé aux erreurs techniques.
- Jamais de message culpabilisant : on affiche des faits (« 2 séances cette semaine »).

## Ajouter la police Archivo (facultatif)

Par défaut, l'application utilise les polices du système (aucune requête externe). Pour utiliser Archivo :

1. Télécharge Archivo (licence libre) et place les fichiers `.woff2` dans un dossier `fonts/`.
2. Crée `css/fonts.css` avec les règles `@font-face` pointant vers `../fonts/…`.
3. Ajoute `<link rel="stylesheet" href="css/fonts.css">` dans `index.html`, et `font-src 'self'` dans la politique de contenu.
4. Ajoute les nouveaux fichiers à la liste `CORE` de `sw.js`, puis change le numéro de version (voir README).
