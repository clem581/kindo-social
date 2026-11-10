// Holt Termine von kindo.at – so wenige Abrufe wie möglich, die Live-Seite sperrt bei vielen.
// Aufruf: node termine.js          →  Wochenend-Termine (1 Abruf)
//         node termine.js woche    →  ab morgen bis Freitag, je Tag 1 Abruf mit Pause
//                                     (die Wochen-Liste von kindo.at zeigt nur rund 300 Karten
//                                     und reicht an einem Montag oft nicht bis Freitag)
//         node termine.js heute    →  nur heute (1 Abruf)
//         node termine.js morgen   →  nur morgen (1 Abruf), für die Story „Tipp des Tages“ (läuft am Vorabend)
//         node termine.js kurse    →  Kurse, die nächste Woche (Mo–So) anfangen (1 Abruf von /kurse)
// Ausgabe: eine Zeile je Termin: id | Tag Datum Monat Kategorie Alter Bezirk Titel Zeit Ort Preis …
//          bei Kursen:           id | Start JJJJ-MM-TT | Kategorie Alter Bezirk Titel Rhythmus Einheiten Ort Preis
// Verifizierte Veranstaltungen (Stempel auf kindo.at) beginnen mit „✔ VERIFIZIERT …“ – siehe README.
const fs = require('fs');
const path = require('path');
const BASIS = 'https://www.kindo.at';
const MONATE = ['Jän', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const wienHeute = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Vienna' });

const text = s => s
  .replace(/<form[\s\S]*?<\/form>/g, '').replace(/<button[\s\S]*?<\/button>/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;|&#34;/g, '"')
  .replace(/\s+/g, ' ').replace(/^[^A-Za-zÄÖÜäöü]*/, '').trim();

// Tage ab morgen bis einschließlich Freitag, als JJJJ-MM-TT (Wiener Datum)
function wochentage() {
  const heute = wienHeute();
  const tage = [];
  for (let d = new Date(heute + 'T12:00:00Z'); ;) {
    d = new Date(d.getTime() + 864e5);
    const wt = d.getUTCDay(); // 0 = Sonntag … 5 = Freitag
    if (wt === 0 || wt === 6) break;
    tage.push(d.toISOString().slice(0, 10));
    if (wt === 5) break;
  }
  if (!tage.length) throw new Error('Bis Freitag ist kein Wochentag mehr übrig – „woche“ am Montag laufen lassen.');
  return tage;
}

// Montag und Sonntag der nächsten Woche (nach heute), als JJJJ-MM-TT
function naechsteWoche(heute) {
  const d = new Date(heute + 'T12:00:00Z');
  const mo = new Date(d.getTime() + ((8 - d.getUTCDay()) % 7 || 7) * 864e5);
  return [mo, new Date(mo.getTime() + 6 * 864e5)].map(x => x.toISOString().slice(0, 10));
}

// Kursbeginn aus dem Kartentext: „· ab 9. Nov“ (in einem anderen Jahr „ab 13. Jän 2027“);
// „Anmeldung ab …“ ist nicht der Beginn. Laufende Kurse („bis …“) haben keinen → ''.
function kursStart(karte, heute) {
  const m = karte.match(new RegExp(`(?<!Anmeldung )\\bab (\\d{1,2})\\. (${MONATE.join('|')})(?: (\\d{4}))?`));
  if (!m) return '';
  const mon = String(MONATE.indexOf(m[2]) + 1).padStart(2, '0');
  return `${m[3] || heute.slice(0, 4)}-${mon}-${m[1].padStart(2, '0')}`;
}

// Titel vergleichbar machen: klein, nur Buchstaben und Ziffern
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9äöüß]+/g, ' ').trim();

// Verifizierte Veranstaltungen (Stempel auf kindo.at) kommen einmal ins Karussell und einmal
// als Story. Wo war diese schon? art 'story' → story/verlauf.txt, sonst die Karussells in
// beitraege/*.json (Feld `verifiziert` oder `titel` des Tipps). Gekürzte Titel zählen auch,
// wenn der eine mit dem anderen anfängt. Rückgabe: wo (Datei bzw. Tag) oder ''.
function schonGezeigt(titel, art, ordner = __dirname) {
  const t = norm(titel);
  const passt = x => { const n = norm(x); return !!n && (n === t || (n.length >= 8 && (t.startsWith(n) || n.startsWith(t)))); };
  if (art === 'story') {
    const datei = path.join(ordner, 'story', 'verlauf.txt');
    if (!fs.existsSync(datei)) return '';
    const zeile = fs.readFileSync(datei, 'utf8').split('\n').find(z => passt(z.split(' | ').slice(2).join(' | ')));
    return zeile ? `Story ${zeile.split(' | ')[0]}` : '';
  }
  const dir = path.join(ordner, 'beitraege');
  if (!fs.existsSync(dir)) return '';
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
    const b = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8').replace(/^﻿/, ''));
    if ((b.tipps || []).some(tp => passt(tp.verifiziert) || passt(tp.titel))) return `beitraege/${f}`;
  }
  return '';
}

// Kennzeichen vor der Zeile einer verifizierten Karte (leer bei allen anderen).
// gesehen: Titel, die in diesem Lauf schon markiert wurden – dasselbe Stück an mehreren Tagen nur einmal.
function stempel(body, art, gesehen, ordner) {
  if (!body.includes('chip-verifiziert')) return '';
  const titel = text((body.match(/class="card-title"[^>]*>([\s\S]*?)<\/h3>/) || [])[1] || '');
  if (gesehen.has(norm(titel))) return '✔ VERIFIZIERT – gleiche Veranstaltung wie oben, nicht nochmal | ';
  gesehen.add(norm(titel));
  const wo = schonGezeigt(titel, art, ordner);
  return wo ? `✔ VERIFIZIERT – schon gezeigt (${wo}), nicht nochmal | ` : `✔ VERIFIZIERT „${titel}“ – muss rein | `;
}

// Alle Karten einer Liste; mit kurse = [Montag, Sonntag] nur die Kurse, die in dieser Woche anfangen
async function liste(url, kurse, art, gesehen) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`kindo.at antwortet mit ${res.status} (${url})`);
  const karten = (await res.text()).split('<article class="card event-card').slice(1);
  let treffer = 0;
  for (const k of karten) {
    const body = k.split('</article>')[0];
    const id = (body.match(/(?:veranstaltungen|kurse)\/(\d+)/) || [])[1];
    const zeile = text(body.slice(body.indexOf('>') + 1)).slice(0, 300);
    if (!kurse) { console.log(`${id} | ${stempel(body, art, gesehen)}${zeile}`); continue; }
    const start = kursStart(zeile, wienHeute());
    if (start < kurse[0] || start > kurse[1]) continue;
    console.log(`${id} | Start ${start} | ${zeile}`);
    treffer++;
  }
  if (kurse) console.log(`\n${treffer} Kurse starten ${kurse[0]} bis ${kurse[1]} (von ${karten.length} auf der Liste)`);
  return karten.length;
}

async function main() {
  const heute = wienHeute();
  const art = process.argv[2];
  const kurse = art === 'kurse' ? naechsteWoche(heute) : null;
  const urls = art === 'woche' ? wochentage().map(t => `${BASIS}/veranstaltungen?zeitraum=tag&tag=${t}`)
    : art === 'heute' ? [`${BASIS}/veranstaltungen?zeitraum=tag&tag=${heute}`]
    : art === 'morgen' ? [`${BASIS}/veranstaltungen?zeitraum=tag&tag=${new Date(new Date(heute + 'T12:00:00Z').getTime() + 864e5).toISOString().slice(0, 10)}`]
    : kurse ? [`${BASIS}/kurse`]
    : [`${BASIS}/veranstaltungen/wochenende`];
  let n = 0;
  const gesehen = new Set();
  const stempelArt = art === 'morgen' || art === 'heute' ? 'story' : 'feed';
  for (const [i, url] of urls.entries()) {
    if (i) await new Promise(r => setTimeout(r, 2000));
    n += await liste(url, kurse, stempelArt, gesehen);
  }
  if (!n) throw new Error('Keine Termine gefunden – hat sich der Aufbau der Seite geändert?');
  console.log(`\n${n} Termine (Quelle: ${urls.join(', ')})`);
}

module.exports = { naechsteWoche, kursStart, schonGezeigt, stempel };

if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });
