# Architecture de Fonte

## Principes

1. **Local d'abord** : l'appareil est la source de vérité. Aucun serveur, aucun compte.
2. **Domaine pur** : les règles (matériel, planning, séance, validation) ne dépendent ni de l'interface ni du stockage. Elles sont testées seules.
3. **Aucune dépendance** : JavaScript natif (modules ES), HTML, CSS. Pas d'étape de compilation, donc rien à installer pour publier.
4. **Historique immuable** : chaque séance enregistrée garde une copie du plan utilisé (`plan`). Modifier le programme ne réécrit jamais le passé.

## Couches (une couche ne connaît que celles du dessous)

```
js/ui/        vues : chaînes HTML à partir de l'état
js/app/       état partagé, actions, fonctions du navigateur (son, vibration, écran allumé)
js/domain/    règles métier pures (aucune E/S)
js/data/      stockage (IndexedDB / mémoire), migrations, import/export
js/main.js    point d'entrée : ouverture, rendu, minuteur
js/boot.js    choix du stockage et service worker (navigateur seulement)
```

## Décisions et écarts avec le plan initial

| Sujet | Plan initial | Réalisé | Raison |
|---|---|---|---|
| Outils | React, TypeScript, Vite, Dexie | JavaScript natif, aucun outil de build | Publication sans installation ni compilation, aucune dépendance à surveiller, code vérifiable par tests Node |
| Séries | Table `setLog` séparée | Séries dans la séance (`sessions[].exs[].sets`) | Écriture atomique, volume faible. Séparable plus tard par migration |
| Séance en cours | Table dédiée | Clé `active` du magasin `kv` | Même effet, plus simple |
| Polices | Archivo auto-hébergée | Polices du système (pile condensée) | Aucune requête vers un tiers, hors ligne garanti. Voir `docs/design.md` |
| Types | TypeScript | Validation à l'exécution (`domain/validate.js`) + tests | Les données importées sont de toute façon à valider à l'exécution |

## Stockage

IndexedDB, base `fonte`, magasins : `kv` (réglages, déplacements, séance active, version du schéma), `equipment`, `templates`, `sessions`, `pain`.
Les écritures passent par une file (`data/repo.js`) : elles s'exécutent dans l'ordre. Une erreur d'écriture prévient l'utilisateur sans bloquer l'application.

## Migrations

`data/migrations.js` : base vide → état initial. Version plus ancienne → migrations successives. Version plus récente que l'application → refus explicite, sans rien écraser. Ajouter une migration : incrémenter `SCHEMA_VERSION` (`domain/validate.js`) et ajouter la fonction correspondante à `MIGRATIONS`.

## Sécurité et confidentialité

- Politique de contenu stricte : `script-src 'self'`, aucune ressource externe, pas de script en ligne (vérifié par test).
- Les textes saisis sont toujours échappés avant affichage.
- Un fichier importé est validé champ par champ avant toute écriture, et son empreinte SHA-256 doit correspondre.
- Aucune donnée de poids corporel, aucune donnée envoyée, aucun suivi.

## Mode hors ligne

`sw.js` précache tous les fichiers (liste `CORE`). Une nouvelle version s'installe en arrière-plan et s'active au lancement suivant. Limites : un minuteur ne peut pas sonner de façon garantie écran verrouillé (l'écran reste allumé pendant la séance par défaut), et les notifications programmées ne sont pas possibles sans serveur.

## Ce qui reste à construire

Suggestions de progression (moteur de règles), récupération, objectifs, graphiques, calendrier, notifications dans l'application, séances personnalisées, saisie gauche/droite.
