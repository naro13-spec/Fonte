// Catalogue d'exercices fourni avec l'application.
// Champs : n nom, g groupe, m muscles principaux, s secondaires, req capacités requises,
// d difficulté 1-5, meas 'reps'|'sec', load 'bw'|'pair'|'single'|'any', bwOK charge nulle possible,
// safe niveau de sécurité du support, uni unilatéral, alt alternative, lev leviers de progression
// ('CHARGE' = charge supérieure si elle existe).

export const EXERCISES = {};

export const EQ_LABEL = {
  db: 'Haltères', mat: 'Tapis', chair: 'Chaise', seat: 'Chaise ou tabouret',
  table: 'Table solide', bar: 'Barre de traction', band: 'Élastiques', bench: 'Banc'
};

export const SAFE_TXT = {
  furn: { t: 'Meuble utilisé comme support', body: "Cale le meuble contre un mur et pousse-le fort avant de commencer : il ne doit ni glisser ni basculer. Un meuble n'est pas du matériel de sport certifié. Si tu as un doute, prends l'alternative." },
  ctrl: { t: 'Avant de commencer les dips', body: "Pose une haltère sur chaque assise, chaises bien face à face. Pousse fort sur chacune : elles ne doivent ni bouger ni basculer. Ne descends pas sous 90° au coude. Arrête-toi si l'épaule te gêne." },
  table: { t: 'Table utilisée comme support', body: "La table doit être lourde, fixe, sans rallonge ni pied amovible. Tire dessus fort avant la première série. En cas de doute, prends l'alternative." }
};

export const GROUPS = ['Poussée', 'Épaules', 'Bras', 'Jambes', 'Dos', 'Gainage'];

const LV_T = 'Tempo plus lent : 3 s à la descente';
const LV_P = 'Pause isométrique : 1 à 2 s dans la position la plus difficile';

function X(id, o) { o.id = id; EXERCISES[id] = o; }

X('pompes', { n: 'Pompes standard', g: 'Poussée', m: ['Pectoraux'], s: ['Triceps', 'Épaules'], req: ['mat'], d: 2, meas: 'reps', load: 'bw',
  cues: ['Corps gainé de la tête aux talons', 'Coudes à environ 45° du buste', 'Poitrine près du sol, poussée complète'], err: ["Bassin qui s'affaisse", 'Coudes trop écartés'],
  lev: [LV_T, 'Pause de 1 s poitrine près du sol', 'Variante plus difficile : pompes décalées ou archer'], vars: ['Sur les genoux ou mains surélevées (plus facile)', 'Décalées, archer (plus difficile)'] });
X('pompes_dec', { n: 'Pompes déclinées, pieds sur chaise', g: 'Poussée', m: ['Pectoraux', 'Épaules'], s: ['Triceps'], req: ['chair'], d: 3, meas: 'reps', load: 'bw', safe: 'furn',
  cues: ['Chaise calée contre un mur', 'Corps en planche, fessiers serrés', 'Descends sous contrôle'], err: ['Chaise qui glisse', 'Dos creusé'],
  lev: [LV_T, 'Pause de 1 s en bas', 'Variante plus difficile : pompes archer'], vars: ['Pompes standard (plus facile)', 'Pompes archer (plus difficile)'], alt: 'pompes' });
X('pompes_diamant', { n: 'Pompes diamant', g: 'Poussée', m: ['Triceps'], s: ['Pectoraux', 'Épaules'], req: ['mat'], d: 3, meas: 'reps', load: 'bw',
  cues: ['Mains rapprochées sous la poitrine', 'Coudes près du corps', 'Poignets alignés, sans forcer'], err: ['Poignets en tension', "Coudes qui s'ouvrent"],
  lev: [LV_T, 'Pause de 1 s en bas', 'Pompes serrées avec pieds surélevés'], vars: ['Pompes serrées (plus facile)'], alt: 'pompes_serrees' });
X('pompes_serrees', { n: 'Pompes serrées', g: 'Poussée', m: ['Triceps', 'Pectoraux'], s: ['Épaules'], req: ['mat'], d: 2, meas: 'reps', load: 'bw',
  cues: ["Mains à largeur d'épaules ou un peu moins", 'Coudes le long du corps'], err: ['Bassin qui tombe'], lev: [LV_T, 'Pause de 1 s en bas'], vars: ['Pompes diamant (plus difficile)'] });
X('dev_mil', { n: 'Développé militaire haltères', g: 'Épaules', m: ['Épaules'], s: ['Triceps'], req: ['db'], d: 2, meas: 'reps', load: 'pair',
  cues: ['Pieds à largeur de bassin, abdos serrés', 'Pousse droit au-dessus de la tête', 'Ne cambre pas le bas du dos'], err: ['Dos cambré', "Haltères qui partent vers l'avant"],
  lev: [LV_T, LV_P, 'CHARGE'], vars: ['Assis sur une chaise dossier droit (plus stable)'] });
X('elev_lat', { n: 'Élévations latérales', g: 'Épaules', m: ['Épaules'], s: [], req: ['db'], d: 1, meas: 'reps', load: 'pair',
  cues: ['Coudes légèrement fléchis', "Monte jusqu'à hauteur d'épaules", 'Descends en 2 secondes'], err: ['Élan du buste', 'Épaules qui montent vers les oreilles'],
  lev: [LV_T, LV_P, 'CHARGE'], vars: ['Une main à la fois, en s\'appuyant'] });
X('oiseau', { n: 'Oiseau penché (deltoïdes arrière)', g: 'Épaules', m: ['Épaules'], s: ['Dos'], req: ['db'], d: 2, meas: 'reps', load: 'pair',
  cues: ['Buste penché, dos plat', 'Ouvre les bras en arc, coudes souples', 'Pince les omoplates en haut'], err: ['Dos arrondi', 'Élan'], note: 'Les 5 kg suffisent largement ici.',
  lev: [LV_T, LV_P, 'CHARGE'], vars: ['Appuyé sur une chaise, front soutenu'] });
X('ext_tri', { n: 'Extension triceps nuque (une haltère)', g: 'Bras', m: ['Triceps'], s: [], req: ['db'], d: 2, meas: 'reps', load: 'single',
  cues: ['Haltère tenue à deux mains', 'Coudes pointés vers le haut, proches de la tête', 'Seuls les avant-bras bougent'], err: ["Coudes qui s'écartent", 'Dos cambré'],
  lev: [LV_T, LV_P, 'CHARGE'], vars: ['Une main à la fois (plus difficile)'] });
X('dips', { n: 'Dips entre deux chaises', g: 'Poussée', m: ['Triceps'], s: ['Pectoraux', 'Épaules'], req: ['chair'], d: 3, meas: 'reps', load: 'bw', safe: 'ctrl',
  cues: ["Chaises face à face, haltères posés sur les assises", "Coudes vers l'arrière, descente jusqu'à environ 90°", "Épaules basses, loin des oreilles"], err: ["Descendre trop bas (contrainte sur l'épaule)", 'Chaise qui bouge'],
  lev: [LV_T, 'Pause de 1 s en bas', 'Jambes tendues (plus difficile)'], vars: ['Dips sur une chaise, pieds au sol (plus facile)'], alt: 'pompes_serrees' });
X('squat_goblet', { n: 'Squat goblet', g: 'Jambes', m: ['Quadriceps', 'Fessiers'], s: ['Abdos'], req: ['db'], d: 2, meas: 'reps', load: 'pair',
  cues: ['Haltères contre la poitrine', "Pieds légèrement ouverts, genoux dans l'axe des pieds", 'Descends le plus bas possible en gardant le dos droit'], err: ['Genoux qui rentrent', 'Talons qui décollent'],
  lev: [LV_T, LV_P, 'Variante unilatérale : squat bulgare ou pistolet assisté', 'CHARGE'], vars: ['Squat au poids du corps (plus facile)', 'Fentes bulgares (plus difficile)'] });
X('bulgare', { n: 'Fentes bulgares', g: 'Jambes', m: ['Quadriceps', 'Fessiers'], s: ['Ischios'], req: ['chair', 'db'], d: 3, meas: 'reps', load: 'pair', safe: 'furn', uni: true,
  cues: ['Chaise calée contre un mur, pied arrière dessus', "Buste légèrement penché, genou avant dans l'axe", 'Descends sous contrôle'], err: ['Chaise qui glisse', 'Pied avant trop proche'],
  lev: [LV_T, LV_P, 'CHARGE'], vars: ['Fentes arrière (plus facile)'], alt: 'fentes_arr' });
X('hip_thrust', { n: 'Hip thrust, épaules sur chaise', g: 'Jambes', m: ['Fessiers'], s: ['Ischios'], req: ['chair', 'db'], d: 2, meas: 'reps', load: 'any', bwOK: true, safe: 'furn',
  cues: ['Chaise calée contre un mur, haut du dos dessus', 'Pousse avec les talons, menton rentré', 'Serre les fessiers en haut'], err: ['Chaise qui recule', 'Bas du dos cambré en haut'],
  lev: [LV_T, 'Pause de 2 s en haut', 'Variante unilatérale : une jambe à la fois', 'CHARGE'], vars: ['Pont fessier au sol (plus facile)'], alt: 'pont_fessier' });
X('sdt_rm', { n: 'Soulevé de terre roumain unijambiste', g: 'Jambes', m: ['Ischios', 'Fessiers'], s: ['Lombaires'], req: ['db'], d: 3, meas: 'reps', load: 'any', bwOK: true, uni: true,
  cues: ["Jambe d'appui légèrement fléchie", "Bascule le bassin vers l'arrière, dos plat", 'Haltère proche de la jambe'], err: ['Dos arrondi', 'Bassin qui pivote'],
  lev: [LV_T, LV_P, 'CHARGE'], vars: ['Deux jambes (plus facile)'] });
X('mollets', { n: 'Mollets debout sur marche', g: 'Jambes', m: ['Mollets'], s: [], req: ['db', 'seat'], d: 1, meas: 'reps', load: 'any', bwOK: true,
  cues: ['Pointe du pied sur le bord stable', 'Monte le plus haut possible', 'Pause de 2 s en haut'], err: ['Rebond', 'Amplitude réduite'],
  note: "Utilise une marche solide ou une chaise calée. Le petit tabouret n'est pas prévu pour supporter ton poids en appui sur le bord.",
  lev: [LV_P, 'Variante unilatérale : un pied à la fois', 'CHARGE'], vars: ['Un pied à la fois (plus difficile)'] });
X('squat_saute', { n: 'Squat sauté', g: 'Jambes', m: ['Quadriceps', 'Fessiers'], s: ['Mollets'], req: [], d: 3, meas: 'reps', load: 'bw',
  cues: ['Atterris en douceur, genoux fléchis', 'Jambes fraîches : fais-le en début de séance', "Pas de saut si une douleur au genou ou à la cheville apparaît"], err: ['Atterrissage raide', 'Genoux qui rentrent'],
  lev: ['Saut plus haut, reçois-toi toujours en silence', 'Pause de 2 s en bas avant le saut'], vars: ['Squat au poids du corps (plus facile)'] });
X('fentes_arr', { n: 'Fentes arrière', g: 'Jambes', m: ['Quadriceps', 'Fessiers'], s: ['Ischios'], req: [], d: 2, meas: 'reps', load: 'any', bwOK: true, uni: true,
  cues: ['Grand pas en arrière', 'Genou avant au-dessus de la cheville', 'Buste droit'], err: ['Pas trop court', "Genou qui s'effondre"], lev: [LV_T, LV_P, 'CHARGE'], vars: ['Fentes bulgares (plus difficile)'] });
X('pont_fessier', { n: 'Pont fessier au sol', g: 'Jambes', m: ['Fessiers'], s: ['Ischios'], req: ['mat'], d: 1, meas: 'reps', load: 'any', bwOK: true,
  cues: ['Talons proches des fesses', 'Pousse le bassin vers le plafond', 'Serre les fessiers en haut'], err: ['Bas du dos cambré'], lev: [LV_P, 'Variante unilatérale : une jambe à la fois', 'CHARGE'], vars: ['Hip thrust sur chaise (plus difficile)'] });
X('rowing_uni', { n: 'Rowing haltère unilatéral penché', g: 'Dos', m: ['Dos'], s: ['Biceps'], req: ['db'], d: 2, meas: 'reps', load: 'single', uni: true,
  cues: ['Main libre sur une chaise calée ou une table', 'Dos plat, tire le coude vers la hanche', 'Descente en 3 secondes'], err: ['Rotation du buste', 'Épaule qui monte'],
  lev: [LV_T, LV_P, 'CHARGE'], vars: ['Rowing inversé (autre angle)'] });
X('rowing_inv', { n: 'Rowing inversé sous table solide', g: 'Dos', m: ['Dos'], s: ['Biceps'], req: ['table'], d: 3, meas: 'reps', load: 'bw', safe: 'table',
  cues: ['Corps droit, talons au sol', 'Tire la poitrine vers le bord de la table', 'Pince les omoplates'], err: ['Bassin qui tombe', 'Table qui bouge'],
  lev: [LV_T, LV_P, 'Pieds surélevés (plus difficile)'], vars: ['Genoux fléchis (plus facile)'], alt: 'rowing_uni' });
X('superman', { n: 'Superman au sol', g: 'Dos', m: ['Lombaires'], s: ['Fessiers'], req: ['mat'], d: 1, meas: 'reps', load: 'bw',
  cues: ['Bras et jambes décollent du sol', 'Regard vers le sol, nuque neutre', 'Pause de 2 s en haut'], err: ["Nuque cassée vers l'arrière"], lev: [LV_P, 'Tenue plus longue'], vars: ['Un bras et la jambe opposée (plus facile)'] });
X('curl', { n: 'Curl biceps haltères', g: 'Bras', m: ['Biceps'], s: [], req: ['db'], d: 1, meas: 'reps', load: 'pair',
  cues: ['Coudes fixes le long du corps', 'Monte sans élan', 'Descends lentement'], err: ['Balancement du buste'], lev: [LV_T, LV_P, 'CHARGE'], vars: ['Une main à la fois'] });
X('curl_marteau', { n: 'Curl marteau', g: 'Bras', m: ['Biceps'], s: ['Avant-bras'], req: ['db'], d: 1, meas: 'reps', load: 'pair',
  cues: ['Paumes face à face', 'Coudes fixes', 'Contrôle la descente'], err: ['Élan'], lev: [LV_T, LV_P, 'CHARGE'], vars: ['Alterné'] });
X('planche', { n: 'Planche', g: 'Gainage', m: ['Abdos'], s: ['Épaules', 'Lombaires'], req: ['mat'], d: 2, meas: 'sec', load: 'bw',
  cues: ['Coudes sous les épaules', 'Corps aligné, fessiers serrés', 'Respire normalement'], err: ['Bassin trop haut ou trop bas'], lev: ['Planche avec un bras ou une jambe levés', 'Planche avec mouvement de bascule'], vars: ['Sur les genoux (plus facile)'] });
X('planche_lat', { n: 'Planche latérale', g: 'Gainage', m: ['Abdos'], s: ['Épaules'], req: ['mat'], d: 2, meas: 'sec', load: 'bw', uni: true,
  cues: ["Coude sous l'épaule", 'Hanches hautes, corps aligné'], err: ['Hanches qui tombent'], lev: ['Jambe du dessus levée'], vars: ['Genou au sol (plus facile)'] });
X('releves_jambes', { n: 'Relevés de jambes allongé', g: 'Gainage', m: ['Abdos'], s: [], req: ['mat'], d: 2, meas: 'reps', load: 'bw',
  cues: ['Bas du dos plaqué au sol', 'Jambes presque tendues', 'Descends lentement'], err: ['Bas du dos qui se creuse'], lev: [LV_T, LV_P], vars: ['Genoux fléchis (plus facile)'] });
X('hollow', { n: 'Hollow hold', g: 'Gainage', m: ['Abdos'], s: [], req: ['mat'], d: 3, meas: 'sec', load: 'bw',
  cues: ['Bas du dos plaqué au sol', 'Bras et jambes tendus, épaules décollées'], err: ['Bas du dos décollé'], lev: ['Bras tendus derrière la tête'], vars: ['Genoux groupés (plus facile)'] });
X('tractions_neg', { n: 'Tractions négatives', g: 'Dos', m: ['Dos'], s: ['Biceps'], req: ['bar'], d: 3, meas: 'reps', load: 'bw',
  cues: ['Monte avec une aide (saut contrôlé)', 'Descente très lente, environ 5 s', 'Bras tendus en bas'], err: ['Chute non contrôlée'], lev: ['Descente de 5 s', 'Pause isométrique en haut'], vars: ['Tractions complètes (plus difficile)'] });
X('tractions', { n: 'Tractions', g: 'Dos', m: ['Dos'], s: ['Biceps'], req: ['bar'], d: 5, meas: 'reps', load: 'bw',
  cues: ['Épaules basses avant de tirer', 'Menton au-dessus de la barre'], err: ['Élan', 'Amplitude incomplète'], lev: [LV_T], vars: ['Tractions négatives (plus facile)'] });
X('tirage_elas', { n: "Tirage vertical à l'élastique", g: 'Dos', m: ['Dos'], s: ['Biceps'], req: ['band'], d: 2, meas: 'reps', load: 'bw',
  cues: ['Élastique fixé solidement en hauteur', 'Tire les coudes vers les côtes'], err: ['Élastique mal fixé'], lev: [LV_T, LV_P], vars: ['Élastique plus résistant'] });
X('face_pull', { n: "Face pull à l'élastique", g: 'Épaules', m: ['Épaules'], s: ['Dos'], req: ['band'], d: 1, meas: 'reps', load: 'bw',
  cues: ['Élastique à hauteur du visage', 'Tire vers le visage, coudes hauts'], err: ["Haussement d'épaules"], lev: [LV_T, LV_P], vars: ['Élastique plus résistant'] });
X('dev_couche', { n: 'Développé couché haltères', g: 'Poussée', m: ['Pectoraux'], s: ['Triceps', 'Épaules'], req: ['bench', 'db'], d: 2, meas: 'reps', load: 'pair',
  cues: ['Omoplates serrées sur le banc', 'Descends sous contrôle'], err: ['Coudes trop écartés'], lev: [LV_T, LV_P, 'CHARGE'], vars: ['Pompes (alternative)'] });
