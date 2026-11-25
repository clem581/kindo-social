// Story „Tipp für <Wochentag>“ (1080 × 1920) – geht am Vortag gegen 18 Uhr automatisch online und
// ist 24 Stunden zu sehen, also am Vorabend UND am Tag selbst. Darum steht im Bild nie „heute“ oder
// „morgen“, sondern der Wochentag. Den Link gibt es über die Bio (kindo.at/story liest story/link.txt).
// Aufruf: node story.js story/2026-10-28.json            → Bild story/2026-10-28/01.png (+ 01.jpg) und story/README.md
//         node story.js story/2026-10-28.json --posten   → zusätzlich als Story auf Instagram veröffentlichen
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
const WOCHENTAG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONAT = ['Jän', 'Feb', 'März', 'April', 'Mai', 'Juni', 'Juli', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const STERN = `<svg aria-hidden="true" width="110" height="110" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round" style="margin-top: -14px"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z"></path></svg>`;

function storyFolie(s) {
  const tag = Date.parse(s.datum) / 864e5;
  let grund = TITELFARBEN[tag % TITELFARBEN.length]; // jeden Tag die nächste KinDo-Farbe
  // Nicht dieselbe Farbe wie der Kopf der Karte, sonst verschwimmt die Karte im Hintergrund
  if (grund === farbe(s.tipp.kategorie)) grund = TITELFARBEN[(tag + 1) % TITELFARBEN.length];
  const schrift = titelschrift(grund);
  const d = new Date(s.datum);
  const wt = WOCHENTAG[d.getUTCDay()];
  // Oben und unten je rund 250 px frei: dort liegen in Instagram Profilbild, Balken und Antwortfeld
  return `<div id="folie" style="width: ${B}px; height: ${SH}px; box-sizing: border-box; padding: 250px 84px 290px; background: ${grund}; display: flex; flex-direction: column; gap: 44px; font-family: 'Nunito', sans-serif; color: ${INK}; overflow: hidden">
<div style="display: flex; justify-content: space-between; align-items: center">${logo(true)}
<div style="transform: rotate(4deg); background: ${grund === '#ffc93c' ? '#ffffff' : '#ffc93c'}; border: 6px solid ${INK}; border-radius: 28px; padding: 18px 32px 12px; box-shadow: 10px 12px 0 rgba(0,0,0,.16); font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 46px; line-height: 1">${d.getUTCDate()}. ${MONAT[d.getUTCMonth()]}</div></div>
<h1 style="margin: 0; font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 120px; line-height: .95; letter-spacing: -3px; color: ${schrift}">Tipp für<br>${wt}</h1>
${tippKarte(s.tipp, STERN)}
<div style="display: flex; justify-content: center; align-items: center; gap: 14px; font-weight: 900; font-size: 40px; color: ${schrift}"><span>Zur Veranstaltung: Link in der Bio</span>${pfeil(44, 2.8).replace(`stroke="${INK}"`, `stroke="${schrift}"`)}</div></div>`;
}

function pruefen(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.datum || '')) throw new Error('datum fehlt (JJJJ-MM-TT)');
  if (!s.tipp) throw new Error('tipp fehlt');
  for (const f of ['kategorie', 'titel', 'satz', 'wann', 'wo', 'alter']) if (!s.tipp[f]) throw new Error(`tipp.${f} fehlt`);
  if (!/^https:\/\/www\.kindo\.at\/veranstaltungen\/\d+$/.test(s.link || '')) throw new Error('link muss https://www.kindo.at/veranstaltungen/<Nummer> sein');
}

// Veröffentlicht story/<T>/01.jpg als Instagram-Story. gepostet.json verhindert doppeltes Posten;
// link.txt (Ziel von kindo.at/story) wechselt erst, wenn die Story wirklich online ist.
async function posten(ordner, s) {
  const { IG, ROH, schluessel, graph, fertig, erreichbar, committen } = require('./posten');
  const tagOrdner = path.join(ordner, s.datum);
  const merker = path.join(tagOrdner, 'gepostet.json');
  if (fs.existsSync(merker)) throw new Error(`Story für ${s.datum} ist schon gepostet – nichts getan.`);
  const rel = path.relative(__dirname, ordner).split(path.sep).join('/');
  const token = schluessel();
  committen(rel, `Story ${s.datum}`);
  const url = `${ROH}${rel}/${s.datum}/01.jpg`;
  await erreichbar([url]);
  const container = (await graph(`/${IG}/media`, { media_type: 'STORIES', image_url: url, access_token: token }, true)).id;
  await fertig(container, token);
  const media = (await graph(`/${IG}/media_publish`, { creation_id: container, access_token: token }, true)).id;
  fs.writeFileSync(merker, JSON.stringify({ media_id: media, gepostet: new Date().toISOString(), link: s.link }, null, 2) + '\n');
  fs.writeFileSync(path.join(ordner, 'link.txt'), s.link + '\n');
  committen(rel, `Story ${s.datum} gepostet`);
  console.log(`Story gepostet (${media}), kindo.at/story zeigt jetzt ${s.link}`);
}

async function main() {
  const [quelle, schalter] = process.argv.slice(2);
  if (!quelle) throw new Error('Aufruf: node story.js story/<datum>.json [--posten]');
  const s = JSON.parse(fs.readFileSync(quelle, 'utf8').replace(/^﻿/, ''));
  pruefen(s);
  const ordner = path.dirname(path.resolve(quelle));
  const merker = path.join(ordner, s.datum, 'gepostet.json');
  // Schon gepostet: Bild nicht neu erzeugen (rendern leert den Ordner und löschte den Merker)
  if (fs.existsSync(merker)) throw new Error(`Story für ${s.datum} ist schon gepostet – nichts getan.`);
  await rendern([storyFolie(s)], path.join(ordner, s.datum), SH, true);
  // Fester Name, damit Clemens am Handy immer denselben Link öffnen kann
  fs.copyFileSync(path.join(ordner, s.datum, '01.png'), path.join(ordner, 'heute.png'));

  // Nur der aktuelle Tag bleibt liegen, damit das öffentliche Repo nicht mit alten Bildern wächst
  for (const f of fs.readdirSync(ordner)) {
    if (/^\d{4}-\d{2}-\d{2}(\.json)?$/.test(f) && !f.startsWith(s.datum)) fs.rmSync(path.join(ordner, f), { recursive: true, force: true });
  }
  const d = new Date(s.datum);
  fs.writeFileSync(path.join(ordner, 'README.md'), `# Tipp für ${WOCHENTAG[d.getUTCDay()]} – ${d.getUTCDate()}.${d.getUTCMonth() + 1}.

![Tipp für ${WOCHENTAG[d.getUTCDay()]}: ${s.tipp.titel}](${s.datum}/01.png)

**Veranstaltung:** ${s.link}

Die Story wird am Vortag gegen 18 Uhr automatisch gepostet. Der Bio-Link kindo.at/story führt danach auf diese Veranstaltung.
`);
  const verlauf = path.join(ordner, 'verlauf.txt');
  // Eine Zeile je Tag; wird ein Tag neu erzeugt, ersetzt die neue Zeile die alte
  const alt = fs.existsSync(verlauf) ? fs.readFileSync(verlauf, 'utf8').split('\n').filter(z => z && !z.startsWith(`${s.datum} |`)) : [];
  // Verifizierte Veranstaltung: ihr voller Titel, damit termine.js sie wiedererkennt (README)
  fs.writeFileSync(verlauf, [...alt, `${s.datum} | ${s.link} | ${s.tipp.verifiziert || s.tipp.titel}`].join('\n') + '\n');
  if (schalter === '--posten') await posten(ordner, s);
}

module.exports = { storyFolie, pruefen };

if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });
