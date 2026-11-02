// Instagram-Markierungen der Veranstalter für einen Beitrag – nur Namen aus instagram.json.
// Aufruf: node markieren.js beitraege/<datei>.json
//   →  JSON: { "carouselTags": { "1": [{ "username", "x", "y" }], … }, "erwaehnungen": ["@name", …], "fehlen": ["Veranstalter", …] }
//      Position wie media in Metricool: 0 = Titelbild, 1 = Tipp 1 …; "fehlen" = Veranstalter, die noch nicht in der Liste stehen.
//         node markieren.js suchen https://www.veranstalter.at
//   →  die Instagram-Konten, die auf dieser Webseite verlinkt sind (ein Abruf)
//
// instagram.json: { "<Veranstalter wie im Feld veranstalter>": { "instagram": "name" oder null, "quelle": "<Webseite>", "geprueft": "JJJJ-MM-TT" } }
// null = auf der Webseite ist kein Instagram-Konto verlinkt (nicht jede Woche neu suchen).
const fs = require('fs');
const path = require('path');

const NAME = /^[a-z0-9._]{1,30}$/;
// Pfade auf instagram.com, die kein Konto sind
const KEIN_KONTO = new Set(['p', 'reel', 'reels', 'explore', 'stories', 'accounts', 'about', 'developer', 'legal', 'tv', 'direct', 'share', 'sharer']);
const lesen = f => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));

// Eintrag zum Namen: genau gleich geschrieben, sonst ein Eintrag, der den Namen enthält (oder umgekehrt) –
// aber nur, wenn alle so gefundenen Einträge dasselbe Konto haben („DSCHUNGEL WIEN“ → alle Dschungel-Bühnen)
function eintragZu(name, liste) {
  if (liste[name]) return liste[name];
  const n = name.toLowerCase();
  if (n.length < 6) return null;
  const treffer = Object.entries(liste).filter(([k]) => k.toLowerCase().includes(n) || n.includes(k.toLowerCase())).map(([, e]) => e);
  return treffer.length && treffer.every(e => e.instagram === treffer[0].instagram) ? treffer[0] : null;
}

function markierungen(b, liste) {
  const carouselTags = {}, erwaehnungen = [], fehlen = [];
  b.tipps.forEach((t, i) => {
    if (!t.veranstalter) return;
    const eintrag = eintragZu(t.veranstalter, liste);
    if (!eintrag) { if (!fehlen.includes(t.veranstalter)) fehlen.push(t.veranstalter); return; }
    if (!eintrag.instagram) return;
    if (!NAME.test(eintrag.instagram)) throw new Error(`instagram.json: "${eintrag.instagram}" ist kein Instagram-Name`);
    carouselTags[i + 1] = [{ username: eintrag.instagram, x: 0.5, y: 0.5 }];
    if (!erwaehnungen.includes('@' + eintrag.instagram)) erwaehnungen.push('@' + eintrag.instagram);
  });
  return { carouselTags, erwaehnungen, fehlen };
}

function kontenIn(html) {
  const konten = [];
  for (const m of html.matchAll(/instagram\.com\/([A-Za-z0-9._]{1,30})(?![A-Za-z0-9._])/g)) {
    const name = m[1].toLowerCase().replace(/\.+$/, '');
    if (NAME.test(name) && !KEIN_KONTO.has(name) && !konten.includes(name)) konten.push(name);
  }
  return konten;
}

async function main() {
  if (process.argv[2] === 'suchen') {
    const url = process.argv[3];
    if (!/^https?:\/\//.test(url || '')) throw new Error('Aufruf: node markieren.js suchen https://…');
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`${url} antwortet mit ${res.status}`);
    const konten = kontenIn(await res.text());
    console.log(konten.length ? konten.join('\n') : 'Kein Instagram-Konto verlinkt.');
    return;
  }
  const quelle = process.argv[2];
  if (!quelle) throw new Error('Aufruf: node markieren.js beitraege/<datei>.json');
  const liste = lesen(path.join(__dirname, 'instagram.json'));
  console.log(JSON.stringify(markierungen(lesen(quelle), liste), null, 2));
}

module.exports = { markierungen, kontenIn };

if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });
