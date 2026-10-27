# KinDo – Bilder für Social Media

Hier liegen die Bilder der wöchentlichen Instagram-Beiträge von [@kindo_wien](https://www.instagram.com/kindo_wien/).
Das Repo ist öffentlich, damit Metricool die Bilder über ihre Adresse abholen kann.
Hier liegt nichts, was nicht ohnehin auf Instagram erscheint.

## So entsteht ein Bild

1. Eine Datei `beitraege/<Samstag>.json` mit Titel, Datum und bis zu 6 Terminen anlegen.
2. `node bild.js beitraege/<Samstag>.json` – das Bild landet als `.png` daneben (1080 × 1350).
3. Committen und pushen. Die öffentliche Adresse ist dann
   `https://raw.githubusercontent.com/clem581/kindo-social/main/beitraege/<Samstag>.png`.

Ist der Text zu lang fürs Bild, bricht `bild.js` mit einer Meldung ab.

Einmalig nach dem Klonen: `npm ci`.

Schriften: Baloo 2 und Nunito, beide unter der SIL Open Font License.
