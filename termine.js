// Holt Termine von kindo.at – so wenige Abrufe wie möglich, die Live-Seite sperrt bei vielen.
// Aufruf: node termine.js          →  Wochenend-Termine (1 Abruf)
//         node termine.js woche    →  ab morgen bis Freitag, je Tag 1 Abruf mit Pause
//                                     (die Wochen-Liste von kindo.at zeigt nur rund 300 Karten
//                                     und reicht an einem Montag oft nicht bis Freitag)
// Ausgabe: eine Zeile je Termin: id | Tag Datum Monat Kategorie Alter Bezirk Titel Zeit Ort Preis …
const BASIS = 'https://www.kindo.at';

const text = s => s
  .replace(/<form[\s\S]*?<\/form>/g, '').replace(/<button[\s\S]*?<\/button>/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;|&#34;/g, '"')
  .replace(/\s+/g, ' ').replace(/^[^A-Za-zÄÖÜäöü]*/, '').trim();

// Tage ab morgen bis einschließlich Freitag, als JJJJ-MM-TT (Wiener Datum)
function wochentage() {
  const heute = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Vienna' });
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

async function liste(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`kindo.at antwortet mit ${res.status} (${url})`);
  const karten = (await res.text()).split('<article class="card event-card').slice(1);
  for (const k of karten) {
    const body = k.split('</article>')[0];
    const id = (body.match(/veranstaltungen\/(\d+)/) || [])[1];
    console.log(`${id} | ${text(body.slice(body.indexOf('>') + 1)).slice(0, 300)}`);
  }
  return karten.length;
}

(async () => {
  const urls = process.argv[2] === 'woche'
    ? wochentage().map(t => `${BASIS}/veranstaltungen?zeitraum=tag&tag=${t}`)
    : [`${BASIS}/veranstaltungen/wochenende`];
  let n = 0;
  for (const [i, url] of urls.entries()) {
    if (i) await new Promise(r => setTimeout(r, 2000));
    n += await liste(url);
  }
  if (!n) throw new Error('Keine Termine gefunden – hat sich der Aufbau der Seite geändert?');
  console.log(`\n${n} Termine (Quelle: ${urls.join(', ')})`);
})().catch(e => { console.error(e.message); process.exit(1); });
