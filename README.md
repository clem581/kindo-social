# KinDo – Bilder für Social Media

Hier liegen die Bilder der wöchentlichen Instagram-Beiträge von [@kindo_wien](https://www.instagram.com/kindo_wien/).
Das Repo ist öffentlich, damit Instagram die Bilder über ihre Adresse abholen kann.
Hier liegt nichts, was nicht ohnehin auf Instagram erscheint.

Das Aussehen folgt dem Artefakt „KinDo Instagram-Konzept“ (Vorlagen „Feed · Karussell 1–3“):
https://claude.ai/artifact/Ecvhsn4f6gb8cx7UUdaA8v

## So entsteht ein Wochenend-Karussell

0. `node termine.js` listet die Wochenend-Termine von kindo.at (ein einziger Abruf).
1. Eine Datei `beitraege/<Samstag>.json` anlegen:
   `datum` (z. B. `"31.10. – 1.11."`) und 3–18 `tipps` (18 Tipps + Titel + Schluss = 20 Bilder, die Grenze von Instagram), je mit `kategorie`, `titel`, `satz`,
   `wann`, `wo`, `alter` und – wenn bekannt – `preis`.
   Kategorien: Basteln, Theater, Draußen, Museum, Feste, Musik, Kino, Sport, Lesen, Ausflug,
   Zaubern – jede hat ihre eigene Farbe (`FARBEN` in `bild.js`; `node --test` prüft, dass sich
   keine zwei Kategorien eine Farbe teilen).
2. `node bild.js beitraege/<Samstag>.json` – die Bilder landen im Ordner `beitraege/<Samstag>/`
   (1080 × 1350): `01.png` Titel, je ein Bild pro Tipp, zuletzt das Schlussbild – jedes zusätzlich
   als `01.jpg` …, denn die Instagram-Schnittstelle nimmt nur JPEG.
3. Committen und pushen, dann `beitraege/<Samstag>/post.json` anlegen und mit `posten.js` posten
   (siehe unten).

Passt ein Text nicht aufs Bild, bricht `bild.js` mit einer Meldung ab.

## Posten mit posten.js

Seit 27.11.2026 posten alle drei Routinen direkt über die Instagram-Schnittstelle statt über
Metricool – Metricool nimmt nur 10 Bilder je Karussell, Instagram 20. Die Routinen laufen deshalb
am Tag der Veröffentlichung gegen 7:30 Uhr (Fr Wochenende, So Kurse, Mo Woche) und posten am Ende
sofort; der Computer muss dafür laufen.

- `post.json` im Bilder-Ordner: `{ "text": "…", "markierungen": [{ "bild": 2, "name": "…", "x": 0.5, "y": 0.5 }], "altTexte": ["…", …] }`
  (`bild` 1 = Titelbild; die Markierungen liefert `markieren.js` fertig). Text höchstens 2200 Zeichen.
- `node posten.js beitraege/<ordner> --probe` prüft Schlüssel, Bilder und Text, postet nichts.
- `node posten.js beitraege/<ordner>` committet und pusht den Ordner, postet und schreibt
  `gepostet.json` (mit Link) – liegt die schon da, postet es nie ein zweites Mal.
- Schlüssel: `META_POST_TOKEN` in `~/.config/kindo-meta/.env`, nie ins Repo.

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

Sonntag früh erzeugt und gleich gepostet. Das Titelbild ist absichtlich anders als bei den
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
- `node markieren.js beitraege/<datei>.json` gibt die Markierungen für `post.json` (`markierungen`;
  `carouselTags` ist das alte Metricool-Format), die
  @Namen für den Text und die Veranstalter, die noch nicht in der Liste stehen.
- `node markieren.js suchen https://<webseite des veranstalters>` zeigt die Instagram-Konten, die auf
  dessen eigener Webseite verlinkt sind. Nur so ein Konto kommt in die Liste:
  `"EKIZ": { "instagram": "name", "quelle": "https://…", "geprueft": "2026-11-07" }`.
  Ist keins verlinkt: `"instagram": null` (nach 3 Monaten wieder nachsehen).

## Verifizierte Veranstaltungen

Auf kindo.at kann Clemens Veranstaltungen mit einem Verifiziert-Stempel versehen. `termine.js`
schreibt vor solche Zeilen ein Kennzeichen:

- `✔ VERIFIZIERT „<Titel>“ – muss rein`: kommt in den Beitrag, sofern sie die übrigen Regeln
  erfüllt (Uhrzeit, kein Gottesdienst …). Im Karussell als Tipp, bei der Story als der Tipp des Tages.
  Den Titel aus dem Kennzeichen als Feld `"verifiziert"` in den Tipp schreiben – daran erkennt
  `termine.js` beim nächsten Mal, dass sie schon dran war.
- `✔ VERIFIZIERT – schon gezeigt (…)` bzw. `– gleiche Veranstaltung wie oben`: war schon im Feed
  (bzw. als Story) oder steht in dieser Liste noch einmal (z. B. ein Theaterstück an mehreren Tagen) –
  nicht noch einmal nehmen.

Jede verifizierte Veranstaltung kommt so einmal in ein Karussell und einmal als Story.
Geprüft wird für Karussells in `beitraege/*.json`, für die Story in `story/verlauf.txt`.

## Täglich: Story „Tipp für <Wochentag>“ (KT-404)

Eine Veranstaltung von morgen als Story-Bild (1080 × 1920), automatisch gepostet gegen 18 Uhr am
Vortag (Routine „KinDo Story“). Die Story ist 24 Stunden zu sehen – am Vorabend und am Tag selbst –,
darum steht im Bild der Wochentag, nie „heute“ oder „morgen“. Link-Sticker gehen über die
Schnittstelle nicht; unten im Bild steht „Zur Veranstaltung: Link in der Bio“. Der Bio-Link
**kindo.at/story** leitet auf die Veranstaltung in `story/link.txt` weiter, und die wechselt erst,
wenn die neue Story wirklich online ist.

- `node termine.js morgen` listet die Termine von morgen (ein einziger Abruf).
- Eine Datei `story/<tag>.json` anlegen: `datum` (`"2026-10-28"`), `tipp` (Felder wie oben) und
  `link` (`https://www.kindo.at/veranstaltungen/<Nummer>`).
- `node story.js story/<tag>.json` – Bild in `story/<tag>/01.png` (+ `01.jpg` für Instagram), dazu
  `story/README.md`. Ältere Tage werden gelöscht, `story/verlauf.txt` merkt sich, was schon dran war.
- `node story.js story/<tag>.json --posten` – dasselbe und dann als Story veröffentlichen (Schlüssel
  wie bei `posten.js`). `story/<tag>/gepostet.json` verhindert doppeltes Posten.

Einmalig nach dem Klonen: `npm ci`.

Schriften: Baloo 2 und Nunito, beide unter der SIL Open Font License.
