// Story „Tipp des Tages“ (1080 × 1920) – Clemens postet sie selbst in der Instagram-App,
// damit sie nicht das Metricool-Kontingent verbraucht und einen Link-Sticker bekommen kann.
// Aufruf: node story.js story/2026-10-28.json
//   →  story/2026-10-28/01.png und story/README.md (Bild + Link, am Handy auf GitHub öffnen);
//      ältere Tage in story/ werden gelöscht, story/verlauf.txt bekommt eine Zeile.
//
// JSON-Aufbau:
// { "datum": "2026-10-28",
//   "tipp": { "kategorie", "titel", "satz", "wann", "wo", "alter", "preis" (darf fehlen) } – wie in bild.js,
//   "link": "https://www.kindo.at/veranstaltungen/264783" }
const fs = require('fs');
const path = require('path');
const { B, INK, esc, farbe, logo, pfeil, rendern, tippKarte, TITELFARBEN, titelschrift } = require('./bild');

const SH = 1920;
const TAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const STERN = `<svg aria-hidden="true" width="110" height="110" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round" style="margin-top: -14px"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z"></path></svg>`;

function storyFolie(s) {
  const tag = Date.parse(s.datum) / 864e5;
  let grund = TITELFARBEN[tag % TITELFARBEN.length]; // jeden Tag die nächste KinDo-Farbe
  // Nicht dieselbe Farbe wie der Kopf der Karte, sonst verschwimmt die Karte im Hintergrund
  if (grund === farbe(s.tipp.kategorie)) grund = TITELFARBEN[(tag + 1) % TITELFARBEN.length];
  const schrift = titelschrift(grund);
  const [, m, d] = s.datum.split('-');
  const kurz = `${TAGE[new Date(s.datum).getUTCDay()]}, ${+d}.${+m}.`;
  // Oben und unten je rund 250 px frei: dort liegen in Instagram Profilbild, Balken und Antwortfeld
  return `<div id="folie" style="width: ${B}px; height: ${SH}px; box-sizing: border-box; padding: 250px 84px 290px; background: ${grund}; display: flex; flex-direction: column; gap: 44px; font-family: 'Nunito', sans-serif; color: ${INK}; overflow: hidden">
<div style="display: flex; justify-content: space-between; align-items: center">${logo(true)}
<div style="transform: rotate(4deg); background: ${grund === '#ffc93c' ? '#ffffff' : '#ffc93c'}; border: 6px solid ${INK}; border-radius: 28px; padding: 18px 32px 12px; box-shadow: 10px 12px 0 rgba(0,0,0,.16); font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 46px; line-height: 1">${esc(kurz)}</div></div>
<h1 style="margin: 0; font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 130px; line-height: .95; letter-spacing: -3px; color: ${schrift}">Tipp des Tages</h1>
${tippKarte(s.tipp, STERN)}
<div style="display: flex; justify-content: center; align-items: center; gap: 14px; font-weight: 900; font-size: 40px; color: ${schrift}"><span>Mehr für heute auf kindo.at</span>${pfeil(44, 2.8).replace(`stroke="${INK}"`, `stroke="${schrift}"`)}</div></div>`;
}

function pruefen(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.datum || '')) throw new Error('datum fehlt (JJJJ-MM-TT)');
  if (!s.tipp) throw new Error('tipp fehlt');
  for (const f of ['kategorie', 'titel', 'satz', 'wann', 'wo', 'alter']) if (!s.tipp[f]) throw new Error(`tipp.${f} fehlt`);
  if (!/^https:\/\/www\.kindo\.at\//.test(s.link || '')) throw new Error('link muss mit https://www.kindo.at/ beginnen');
}

async function main() {
  const quelle = process.argv[2];
  if (!quelle) throw new Error('Aufruf: node story.js story/<datum>.json');
  const s = JSON.parse(fs.readFileSync(quelle, 'utf8').replace(/^﻿/, ''));
  pruefen(s);
  const ordner = path.dirname(quelle);
  await rendern([storyFolie(s)], path.join(ordner, s.datum), SH);
  // Fester Name, damit Clemens am Handy immer denselben Link öffnen kann
  fs.copyFileSync(path.join(ordner, s.datum, '01.png'), path.join(ordner, 'heute.png'));
  fs.writeFileSync(path.join(ordner, 'link.txt'), s.link + '\n');

  // Nur der aktuelle Tag bleibt liegen, damit das öffentliche Repo nicht mit alten Bildern wächst
  for (const f of fs.readdirSync(ordner)) {
    if (/^\d{4}-\d{2}-\d{2}(\.json)?$/.test(f) && !f.startsWith(s.datum)) fs.rmSync(path.join(ordner, f), { recursive: true, force: true });
  }
  const [, m, d] = s.datum.split('-');
  fs.writeFileSync(path.join(ordner, 'README.md'), `# Tipp des Tages – ${+d}.${+m}.

![Tipp des Tages: ${s.tipp.titel}](${s.datum}/01.png)

**Link für den Sticker:** ${s.link}

So geht's: Bild antippen und speichern, in Instagram als Story posten, Link-Sticker mit dem Link oben dazugeben.

Nur das Bild (fester Link, öffnet im Browser statt in der GitHub-App): https://raw.githubusercontent.com/clem581/kindo-social/main/story/heute.png

Nur der Sticker-Link (fester Link, zum Kopieren): https://raw.githubusercontent.com/clem581/kindo-social/main/story/link.txt
`);
  const verlauf = path.join(ordner, 'verlauf.txt');
  // Eine Zeile je Tag; wird ein Tag neu erzeugt, ersetzt die neue Zeile die alte
  const alt = fs.existsSync(verlauf) ? fs.readFileSync(verlauf, 'utf8').split('\n').filter(z => z && !z.startsWith(`${s.datum} |`)) : [];
  fs.writeFileSync(verlauf, [...alt, `${s.datum} | ${s.link} | ${s.tipp.titel}`].join('\n') + '\n');
}

main().catch(e => { console.error(e.message); process.exit(1); });
