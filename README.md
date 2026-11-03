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

## Sonntags: Kurse, die nächste Woche starten

Samstags erzeugt, Sonntag 8 Uhr veröffentlicht. Das Titelbild ist absichtlich anders als bei den
Veranstaltungen: immer dunkel mit Heftkaros und einem Stundenplan Mo–So – so erkennt man die
Kurs-Beiträge im Feed sofort.

- `node termine.js kurse` listet die Kurse, die nächste Woche (Montag bis Sonntag) anfangen
  (ein einziger Abruf von kindo.at/kurse), je Zeile mit `Start JJJJ-MM-TT`.
- Die Datei heißt `beitraege/kurse-<Montag>.json` und hat `"art": "kurse"`. `datum` nennt Montag bis
  Sonntag, z. B. `"9. – 15.11."`. Jeder Tipp hat zusätzlich `start` (der Tag aus der Liste) – daraus
  färbt `bild.js` die Tage im Stundenplan. Zusätzliche Kategorien: Tanzen, Schwimmen.
- `node --test` prüft die Kurs-Auswahl von `termine.js`.

## Veranstalter markieren

Alle drei Karussells markieren die Veranstalter auf ihrem Bild und nennen sie mit @Namen im Text –
aber nur, wenn ihr Instagram-Name in `instagram.json` steht. Geraten wird nie.

- Jeder Tipp kann `veranstalter` haben (Name des Veranstalters oder Orts, z. B. `"EKIZ"`).
- `node markieren.js beitraege/<datei>.json` gibt die Markierungen für Metricool (`carouselTags`), die
  @Namen für den Text und die Veranstalter, die noch nicht in der Liste stehen.
- `node markieren.js suchen https://<webseite des veranstalters>` zeigt die Instagram-Konten, die auf
  dessen eigener Webseite verlinkt sind. Nur so ein Konto kommt in die Liste:
  `"EKIZ": { "instagram": "name", "quelle": "https://…", "geprueft": "2026-11-07" }`.
  Ist keins verlinkt: `"instagram": null` (nach 3 Monaten wieder nachsehen).

## Täglich: Story „Tipp des Tages“

Eine Veranstaltung des Tages als Story-Bild (1080 × 1920), erzeugt schon am Vorabend um 20 Uhr.
Clemens postet sie selbst in der Instagram-App – so zählt sie nicht zum Metricool-Kontingent und
kann einen Link-Sticker bekommen.

- `node termine.js morgen` listet die Termine von morgen (ein einziger Abruf).
- Eine Datei `story/<tag>.json` anlegen: `datum` (`"2026-10-28"`), `tipp` (Felder wie oben) und
  `link` (die Seite der Veranstaltung auf kindo.at).
- `node story.js story/<tag>.json` – das Bild landet in `story/<tag>/01.png`, dazu `story/README.md`
  mit Bild und Link. Ältere Tage werden gelöscht, `story/verlauf.txt` merkt sich, was schon dran war.
- Am Handy: https://github.com/clem581/kindo-social/tree/main/story – Bild speichern, Link kopieren.

Einmalig nach dem Klonen: `npm ci`.

Schriften: Baloo 2 und Nunito, beide unter der SIL Open Font License.
