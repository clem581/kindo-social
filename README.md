# KinDo – Bilder für Social Media

Hier liegen die Bilder der wöchentlichen Instagram-Beiträge von [@kindo_wien](https://www.instagram.com/kindo_wien/).
Das Repo ist öffentlich, damit Metricool die Bilder über ihre Adresse abholen kann.
Hier liegt nichts, was nicht ohnehin auf Instagram erscheint.

Das Aussehen folgt dem Artefakt „KinDo Instagram-Konzept“ (Vorlagen „Feed · Karussell 1–3“):
https://claude.ai/artifact/Ecvhsn4f6gb8cx7UUdaA8v

## So entsteht ein Wochenend-Karussell

0. `node termine.js` listet die Wochenend-Termine von kindo.at (ein einziger Abruf).
1. Eine Datei `beitraege/<Samstag>.json` anlegen:
   `datum` (z. B. `"31.10. – 1.11."`) und 3–5 `tipps`, je mit `kategorie`, `titel`, `satz`,
   `wann`, `wo`, `alter` und – wenn bekannt – `preis`.
   Kategorien mit eigener Farbe: Basteln, Theater, Draußen, Museum, Feste, Musik, Kino, Sport,
   Lesen, Ausflug, Zaubern.
2. `node bild.js beitraege/<Samstag>.json` – die Bilder landen im Ordner `beitraege/<Samstag>/`
   (1080 × 1350): `01.png` Titel, je ein Bild pro Tipp, zuletzt das Schlussbild.
3. Committen und pushen. Die öffentlichen Adressen sind dann
   `https://raw.githubusercontent.com/clem581/kindo-social/main/beitraege/<Samstag>/01.png` usw.
   Alle zusammen, in dieser Reihenfolge, ergeben in Metricool das Karussell.

Passt ein Text nicht aufs Bild, bricht `bild.js` mit einer Meldung ab.

## Angepinnte Profil-Beiträge

`node profil.js` erzeugt die drei Beiträge, die oben im Profil angepinnt werden („Was ist KinDo?“,
„5 Ideen für Regentage“, „Veranstalter?“) im Ordner `beitraege/profil/`. Ihre Texte stehen direkt in
`profil.js`, die Bildtexte für Instagram in `beitraege/profil/TEXTE.md`. Nur einen neu machen:
`node profil.js regentage`.

## Montags: Tipps für die Woche

Gleich wie oben, mit drei Unterschieden:

- `node termine.js woche` listet die Termine von morgen bis Freitag (je Tag ein Abruf, 2 Sekunden Pause).
- Die Datei heißt `beitraege/woche-<Montag>.json` und hat zusätzlich `"art": "woche"` –
  Titel- und Schlussbild sagen dann „diese Woche“ statt „Wochenende“.
- `datum` nennt Dienstag bis Freitag, z. B. `"3. – 6.11."`.

Einmalig nach dem Klonen: `npm ci`.

Schriften: Baloo 2 und Nunito, beide unter der SIL Open Font License.
