// Erzeugt aus einer Beitrags-Datei (JSON) ein Instagram-Bild im KinDo-Sticker-Look.
// Aufruf: node bild.js beitraege/2026-10-31.json  →  beitraege/2026-10-31.png (1080 × 1350)
//
// JSON-Aufbau:
// { "titel": "Halloween-Wochenende in Wien", "datum": "Sa 31.10. & So 1.11.",
//   "eintraege": [ { "tag": "Sa", "titel": "…", "info": "14 Uhr · gratis" }, … ] }
// Höchstens 6 Einträge; das Wort „gratis“ in info wird grün.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BREITE = 1080, HOEHE = 1350;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function html(b) {
  const zeilen = b.eintraege.map(e => `
    <div class="zeile"><div class="tag ${e.tag === 'So' ? 'so' : ''}">${esc(e.tag)}</div><div>
      <div class="titel">${esc(e.titel)}</div>
      <div class="info">${esc(e.info).replace(/\bgratis\b/gi, m => `<span class="gratis">${m}</span>`)}</div>
    </div></div>`).join('');
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><link rel="stylesheet" href="stil.css"></head>
<body>
  <div class="kopf">
    <div class="logo">Kin<b>Do</b></div>
    <h1>${esc(b.titel)}</h1>
    <div class="datum">${esc(b.datum)}</div>
  </div>
  <div class="liste">${zeilen}</div>
  <div class="fuss">Alle Termine auf <span>kindo.at</span></div>
</body></html>`;
}

async function main() {
  const quelle = process.argv[2];
  if (!quelle) throw new Error('Aufruf: node bild.js beitraege/<datum>.json');
  const b = JSON.parse(fs.readFileSync(quelle, 'utf8'));
  if (!b.titel || !b.datum || !Array.isArray(b.eintraege) || !b.eintraege.length) throw new Error('titel, datum und eintraege fehlen');
  if (b.eintraege.length > 6) throw new Error('Höchstens 6 Einträge passen aufs Bild');

  // Die Seite muss neben stil.css und fonts/ liegen, sonst lädt der Browser die Schriften nicht.
  const tmp = path.join(__dirname, '_bild.html');
  fs.writeFileSync(tmp, html(b));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: BREITE, height: HOEHE } });
    await page.goto('file:///' + tmp.replace(/\\/g, '/'));
    await page.evaluate(() => document.fonts.ready);
    const hoehe = await page.evaluate(() => document.body.scrollHeight);
    if (hoehe > HOEHE) throw new Error(`Text zu lang: Bild wäre ${hoehe} px hoch (erlaubt ${HOEHE}). Titel oder Einträge kürzen.`);
    const ziel = quelle.replace(/\.json$/, '.png');
    await page.screenshot({ path: ziel });
    console.log(ziel);
  } finally {
    await browser.close();
    fs.unlinkSync(tmp);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
