// Holt Termine von kindo.at – so wenige Abrufe wie möglich, die Live-Seite sperrt bei vielen.
// Aufruf: node termine.js          →  Wochenend-Termine (1 Abruf)
//         node termine.js woche    →  ab morgen bis Freitag, je Tag 1 Abruf mit Pause
//                                     (die Wochen-Liste von kindo.at zeigt nur rund 300 Karten
//                                     und reicht an einem Montag oft nicht bis Freitag)
//         node termine.js heute    →  nur heute (1 Abruf), für die Story „Tipp des Tages“
//         node termine.js kurse    →  Kurse, die nächste Woche (Mo–So) anfangen (1 Abruf von /kurse)
// Ausgabe: eine Zeile je Termin: id | Tag Datum Monat Kategorie Alter Bezirk Titel Zeit Ort Preis …
//          bei Kursen:           id | Start JJJJ-MM-TT | Kategorie Alter Bezirk Titel Rhythmus Einheiten Ort Preis
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

// Alle Karten einer Liste; mit kurse = [Montag, Sonntag] nur die Kurse, die in dieser Woche anfangen
async function liste(url, kurse) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`kindo.at antwortet mit ${res.status} (${url})`);
  const karten = (await res.text()).split('<article class="card event-card').slice(1);
  let treffer = 0;
  for (const k of karten) {
    const body = k.split('</article>')[0];
    const id = (body.match(/(?:veranstaltungen|kurse)\/(\d+)/) || [])[1];
    const zeile = text(body.slice(body.indexOf('>') + 1)).slice(0, 300);
    if (!kurse) { console.log(`${id} | ${zeile}`); continue; }
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
    : kurse ? [`${BASIS}/kurse`]
    : [`${BASIS}/veranstaltungen/wochenende`];
  let n = 0;
  for (const [i, url] of urls.entries()) {
    if (i) await new Promise(r => setTimeout(r, 2000));
    n += await liste(url, kurse);
  }
  if (!n) throw new Error('Keine Termine gefunden – hat sich der Aufbau der Seite geändert?');
  console.log(`\n${n} Termine (Quelle: ${urls.join(', ')})`);
}

module.exports = { naechsteWoche, kursStart };

if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });
