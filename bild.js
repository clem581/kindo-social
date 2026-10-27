// Erzeugt aus einer Beitrags-Datei (JSON) ein Instagram-Karussell im Look des
// Claude-Artefakts „KinDo Instagram-Konzept“ (Feed · Karussell 1–3).
// Aufruf: node bild.js beitraege/2026-10-31.json
//   →  beitraege/2026-10-31/01.png (Titel), 02.png … (je ein Tipp), letzte = Schluss; je 1080 × 1350
//
// JSON-Aufbau:
// { "datum": "31.10. – 1.11.",
//   "tipps": [ { "kategorie": "Feste", "titel": "Halloween-Fest im Wurstelprater",
//                "satz": "Ein Satz, was die Kinder dort machen.", "wann": "Sa, 14 Uhr",
//                "wo": "Prater, 2. Bezirk", "alter": "alle Alter", "preis": "gratis" }, … ] }
// 3 bis 5 Tipps. "preis" darf fehlen. Kategorien mit eigener Farbe: siehe FARBEN.
// "art": "woche" macht den Montags-Beitrag (Tipps für die Woche), sonst Wochenende.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const B = 1080, H = 1350;
const INK = '#2a2a3a';
const FARBEN = {
  Basteln: '#f58fb0', Theater: '#a78be0', 'Draußen': '#7cc552', Museum: '#4bc0b8', Feste: '#e8654f',
  Musik: '#7cc552', Kino: '#2f9ae0', Sport: '#7cc552', Lesen: '#4bc0b8', Ausflug: '#7cc552', Zaubern: '#2f9ae0',
};
const farbe = k => FARBEN[k] || '#e8654f';
// Das Titelbild wechselt reihum die Farbe: Montag, Wochenende, nächster Montag … nie zweimal hintereinander gleich.
// Das Datum kommt aus dem Dateinamen (woche-<Montag> bzw. <Samstag>); ohne Datum bleibt es blau.
const TITELFARBEN = ['#2f9ae0', '#e8654f', '#a78be0'];
function titelfarbe(quelle, art) {
  const d = path.basename(quelle).match(/\d{4}-\d{2}-\d{2}/);
  if (!d) return TITELFARBEN[0];
  const woche = Math.floor((Date.parse(d[0]) / 864e5 + 3) / 7); // Wochen seit 1970, ab Montag gezählt
  return TITELFARBEN[(woche * 2 + (art === 'woche' ? 0 : 1)) % TITELFARBEN.length];
}
// Was sich zwischen Wochenend- und Wochen-Beitrag unterscheidet
const TEXTE = {
  wochenende: { kopf: 'Wochenend-Tipps für Wien', frage: 'Was machen wir am Wochenende?', mehr: 'Noch mehr fürs Wochenende?', merken: 'am Samstag wiederfinden' },
  woche: { kopf: 'Wochen-Tipps für Wien', frage: 'Was machen wir diese Woche?', mehr: 'Noch mehr für diese Woche?', merken: 'für den Nachmittag merken' },
};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const KOPF = `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
@font-face { font-family: 'Baloo 2'; src: url('fonts/baloo2-latin.woff2') format('woff2'); font-weight: 400 800; }
@font-face { font-family: 'Nunito'; src: url('fonts/nunito-latin.woff2') format('woff2'); font-weight: 200 1000; }
body { margin: 0 }
</style></head><body>`;
const FUSS = '</body></html>';

const logo = gross => `<div style="display: inline-flex; align-items: center; padding: ${gross ? '16px 36px 10px' : '12px 30px 8px'}; background: ${INK}; border-radius: 999px; font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: ${gross ? 60 : 48}px; line-height: 1; letter-spacing: -1px"><span style="color: #2f9ae0">Kin</span><span style="color: #ffc93c">Do</span></div>`;
const pfeil = (gr, sw) => `<svg aria-hidden="true" width="${gr}" height="${gr}" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>`;
const icon = d => `<div style="width: 76px; height: 76px; border-radius: 999px; background: #eaf4fc; border: 4px solid ${INK}; display: flex; align-items: center; justify-content: center; flex-shrink: 0"><svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${d}</svg></div>`;
const ICON_WANN = '<rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M3 10h18M8 3v4M16 3v4"></path>';
const ICON_WO = '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"></path><circle cx="12" cy="9.5" r="2.5"></circle>';
const ICON_ALTER = '<circle cx="9" cy="7" r="3"></circle><path d="M3 21v-1a6 6 0 0 1 12 0v1"></path><circle cx="17.5" cy="10" r="2.2"></circle><path d="M16 21v-1a4 4 0 0 1 5.5-3.7"></path>';
const zeile = (d, text) => `<div style="display: flex; align-items: center; gap: 18px; font-weight: 800; font-size: 36px; line-height: 1.15">${icon(d)}<span>${esc(text)}</span></div>`;

function titelFolie(b, hintergrund) {
  const kats = [...new Set(b.tipps.map(t => t.kategorie))].slice(0, 4);
  const drehung = [-3, 2, -2, 3];
  const chips = kats.map((k, i) => `<div style="transform: rotate(${drehung[i]}deg); background: ${farbe(k) === hintergrund ? '#ffffff' : farbe(k)}; border: 6px solid ${INK}; border-radius: 999px; padding: 14px 34px; font-weight: 900; font-size: 40px; box-shadow: 8px 10px 0 rgba(0,0,0,.16)">${esc(k)}</div>`).join('');
  return `<div id="folie" style="width: ${B}px; height: ${H}px; box-sizing: border-box; padding: 88px 84px; background: ${hintergrund}; display: flex; flex-direction: column; justify-content: space-between; font-family: 'Nunito', sans-serif; color: ${INK}; overflow: hidden">
<div style="display: flex; justify-content: space-between; align-items: center">${logo(true)}
<div style="transform: rotate(4deg); background: #ffc93c; border: 6px solid ${INK}; border-radius: 28px; padding: 18px 32px 12px; box-shadow: 10px 12px 0 rgba(0,0,0,.16); font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 46px; line-height: 1">${esc(b.datum)}</div></div>
<div style="display: flex; flex-direction: column; gap: 22px">
<div style="font-weight: 900; font-size: 40px; letter-spacing: 3px; text-transform: uppercase; color: #ffffff">${TEXTE[b.art].kopf}</div>
<h1 style="margin: 0; font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 150px; line-height: .95; letter-spacing: -3px; color: #ffffff">${TEXTE[b.art].frage}</h1>
<div style="display: flex; flex-wrap: wrap; gap: 22px; margin-top: 26px">${chips}</div></div>
<div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 6px solid ${INK}; border-radius: 44px; padding: 30px 30px 30px 48px; box-shadow: 10px 12px 0 rgba(0,0,0,.16)">
<div style="display: flex; flex-direction: column; gap: 4px">
<div style="font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 60px; line-height: 1.05">${b.tipps.length} Tipps für euch</div>
<div style="font-weight: 800; font-size: 34px; color: #5f5f6b">nach links wischen</div></div>
<div style="width: 120px; height: 120px; border-radius: 999px; background: #ffc93c; border: 6px solid ${INK}; display: flex; align-items: center; justify-content: center">${pfeil(64, 2.8)}</div></div></div>`;
}

function tippFolie(t, nr, von) {
  const preis = t.preis ? `<div style="display: flex; align-items: center"><div style="transform: rotate(-3deg); background: #ffc93c; border: 5px solid ${INK}; border-radius: 18px; padding: 10px 28px 6px; font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 48px; line-height: 1.1">${esc(t.preis)}</div></div>` : '';
  return `<div id="folie" style="width: ${B}px; height: ${H}px; box-sizing: border-box; padding: 80px 84px; background: #fff6ea; display: flex; flex-direction: column; gap: 44px; font-family: 'Nunito', sans-serif; color: ${INK}; overflow: hidden">
<div style="display: flex; justify-content: space-between; align-items: center">
<div style="background: #ffffff; border: 5px solid ${INK}; border-radius: 999px; padding: 12px 30px; font-weight: 900; font-size: 36px">Tipp ${nr} von ${von}</div>${logo(false)}</div>
<div id="karte" style="flex-grow: 1; min-height: 0; display: flex; flex-direction: column; background: #ffffff; border: 6px solid ${INK}; border-radius: 48px; box-shadow: 12px 14px 0 rgba(0,0,0,.16); overflow: hidden">
<div style="height: 280px; flex-shrink: 0; background: ${farbe(t.kategorie)}; border-bottom: 6px solid ${INK}; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 48px 40px; box-sizing: border-box">
<div style="background: #ffffff; border: 5px solid ${INK}; border-radius: 999px; padding: 10px 30px; font-weight: 900; font-size: 38px">${esc(t.kategorie)}</div>
<div style="width: 190px; height: 190px; border-radius: 999px; background: #ffc93c; border: 6px solid ${INK}; box-shadow: 8px 10px 0 rgba(0,0,0,.16); display: flex; align-items: center; justify-content: center; font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 130px; line-height: 1; padding-top: 14px; box-sizing: border-box; transform: rotate(-6deg)">${nr}</div></div>
<div style="padding: 48px 48px 40px; display: flex; flex-direction: column; gap: 22px; flex-grow: 1">
<h2 id="titel" style="margin: 0; font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 104px; line-height: .98; letter-spacing: -2px; overflow-wrap: break-word">${esc(t.titel)}</h2>
<p style="margin: 0; font-weight: 700; font-size: 38px; line-height: 1.3; color: #4a4a58">${esc(t.satz)}</p>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; margin-top: auto">
${zeile(ICON_WANN, t.wann)}${zeile(ICON_WO, t.wo)}${zeile(ICON_ALTER, t.alter)}${preis}</div></div></div>
<div style="display: flex; justify-content: center; align-items: center; gap: 14px; font-weight: 900; font-size: 36px"><span>Alle Details auf kindo.at</span>${pfeil(40, 2.8)}</div></div>`;
}

const ICON_SPEICHERN = '<path d="M6 3h12v18l-6-4-6 4z"></path>';
const ICON_TEILEN = '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"></path>';
const ICON_FOLGEN = '<circle cx="9" cy="8" r="4"></circle><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6"></path>';
// Die drei Kacheln unten auf dem Schlussbild der Wochen- und Wochenend-Beiträge
const standardKacheln = merken => [
  [ICON_SPEICHERN, 'Speichern', merken],
  [ICON_TEILEN, 'Teilen', 'gemeinsam planen'],
  [ICON_FOLGEN, 'Folgen', 'jeden Montag und Donnerstag neue Tipps'],
];

// s = { mehr: Überschrift, zeile: Satz unter kindo.at, kacheln: [[icon, titel, text] × 3] }
function schlussFolie(s) {
  const kachel = ([d, titel, text]) => `<div style="background: #ffffff; border: 5px solid ${INK}; border-radius: 34px; padding: 30px 24px; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; box-shadow: 8px 10px 0 rgba(0,0,0,.14)">
<svg aria-hidden="true" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>
<div style="font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 44px; line-height: 1">${titel}</div>
<div style="font-weight: 700; font-size: 28px; line-height: 1.25">${text}</div></div>`;
  return `<div id="folie" style="width: ${B}px; height: ${H}px; box-sizing: border-box; padding: 88px 84px; background: #ffc93c; display: flex; flex-direction: column; justify-content: space-between; align-items: center; font-family: 'Nunito', sans-serif; color: ${INK}; overflow: hidden">
${logo(true)}
<div style="display: flex; flex-direction: column; align-items: center; gap: 40px">
<h2 style="margin: 0; text-align: center; font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 120px; line-height: .98; letter-spacing: -2px">${esc(s.mehr)}</h2>
<div style="transform: rotate(-3deg); background: #ffffff; border: 7px solid ${INK}; border-radius: 40px; padding: 26px 64px 16px; box-shadow: 12px 14px 0 rgba(0,0,0,.18); font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 150px; line-height: 1; letter-spacing: -3px; color: #1477b8">kindo.at</div>
<div style="font-weight: 800; font-size: 38px; text-align: center">${esc(s.zeile)}</div></div>
<div style="width: 100%; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px">
${s.kacheln.map(kachel).join('\n')}</div></div>`;
}

function pruefen(b) {
  if (!b.datum || !Array.isArray(b.tipps)) throw new Error('datum und tipps fehlen');
  b.art = b.art || 'wochenende';
  if (!TEXTE[b.art]) throw new Error(`art muss "wochenende" oder "woche" sein, nicht "${b.art}"`);
  if (b.tipps.length < 3 || b.tipps.length > 5) throw new Error('3 bis 5 Tipps nötig');
  b.tipps.forEach((t, i) => {
    for (const f of ['kategorie', 'titel', 'satz', 'wann', 'wo', 'alter']) if (!t[f]) throw new Error(`Tipp ${i + 1}: ${f} fehlt`);
  });
}

// Im Browser: Titel einer Tipp-Folie verkleinern, bis die Karte nicht mehr überläuft; dann prüfen,
// dass nirgends etwas abgeschnitten wird.
function einpassen() {
  const karte = document.getElementById('karte');
  const titel = document.getElementById('titel');
  // Beim Titel nur die Breite: Baloos Unterlängen ragen bei line-height .98 ein paar Pixel hinaus.
  const voll = el => (el.id !== 'titel' && el.scrollHeight > el.clientHeight + 1) || el.scrollWidth > el.clientWidth + 1;
  if (karte) for (let gr = 104; gr >= 64 && (voll(karte) || voll(titel)); gr -= 6) titel.style.fontSize = gr + 'px';
  const zuViel = [...document.querySelectorAll('#folie, #karte, #titel')].filter(voll);
  return zuViel.length ? zuViel.map(e => e.id).join(', ') : '';
}

async function main() {
  const quelle = process.argv[2];
  if (!quelle) throw new Error('Aufruf: node bild.js beitraege/<datum>.json');
  // Ohne BOM: PowerShell schreibt UTF-8-Dateien mit einem unsichtbaren Zeichen davor
  const b = JSON.parse(fs.readFileSync(quelle, 'utf8').replace(/^﻿/, ''));
  pruefen(b);
  const t = TEXTE[b.art];
  const folien = [titelFolie(b, titelfarbe(quelle, b.art)),...b.tipps.map((tipp, i) => tippFolie(tipp, i + 1, b.tipps.length)),
    schlussFolie({ mehr: t.mehr, zeile: 'Alle Termine in Wien – mit Filter nach Alter und Bezirk', kacheln: standardKacheln(t.merken) })];
  await rendern(folien, quelle.replace(/\.json$/, ''));
}

// Jede Folie als PNG 01.png, 02.png … in den Ordner; bricht ab, wenn ein Text nicht passt.
async function rendern(folien, ordner) {
  fs.rmSync(ordner, { recursive: true, force: true });
  fs.mkdirSync(ordner, { recursive: true });
  // Die Seite muss neben fonts/ liegen, sonst lädt der Browser die Schriften nicht.
  const tmp = path.join(__dirname, '_bild.html');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: B, height: H } });
    for (const [i, html] of folien.entries()) {
      fs.writeFileSync(tmp, KOPF + html + FUSS);
      await page.goto('file:///' + tmp.replace(/\\/g, '/'));
      await page.evaluate(() => document.fonts.ready);
      const fehler = await page.evaluate(einpassen);
      if (fehler) throw new Error(`Folie ${i + 1}: Text passt nicht (${fehler}). Titel oder Satz kürzen.`);
      const ziel = path.join(ordner, String(i + 1).padStart(2, '0') + '.png');
      await page.screenshot({ path: ziel });
      console.log(ziel);
    }
  } finally {
    await browser.close();
    fs.rmSync(tmp, { force: true });
  }
}

// Bausteine für profil.js (Beiträge ohne Termine)
module.exports = { B, H, INK, esc, farbe, logo, pfeil, schlussFolie, ICON_SPEICHERN, ICON_TEILEN, ICON_FOLGEN, rendern };

if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });
