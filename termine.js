// Holt die Wochenend-Termine von kindo.at – genau EIN Abruf, die Live-Seite sperrt bei vielen.
// Aufruf: node termine.js  →  eine Zeile je Termin: id | Tag Datum Monat Kategorie Alter Bezirk Titel Zeit Ort Preis …
const URL = 'https://www.kindo.at/veranstaltungen/wochenende';

const text = s => s
  .replace(/<form[\s\S]*?<\/form>/g, '').replace(/<button[\s\S]*?<\/button>/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;|&#34;/g, '"')
  .replace(/\s+/g, ' ').replace(/^[^A-Za-zÄÖÜäöü]*/, '').trim();

(async () => {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`kindo.at antwortet mit ${res.status}`);
  const karten = (await res.text()).split('<article class="card event-card').slice(1);
  if (!karten.length) throw new Error('Keine Termine gefunden – hat sich der Aufbau der Seite geändert?');
  for (const k of karten) {
    const body = k.split('</article>')[0];
    const id = (body.match(/veranstaltungen\/(\d+)/) || [])[1];
    console.log(`${id} | ${text(body.slice(body.indexOf('>') + 1)).slice(0, 300)}`);
  }
  console.log(`\n${karten.length} Termine (Quelle: ${URL})`);
})().catch(e => { console.error(e.message); process.exit(1); });
