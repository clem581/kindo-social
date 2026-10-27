// Die drei angepinnten Profil-Beiträge (ohne Termine, ändern sich selten):
// „Was ist KinDo?“, „5 Ideen für Regentage“ und „Veranstalter? So kommt euer Termin auf KinDo“.
// Aufruf: node profil.js  →  beitraege/profil/<name>/01.png … (je 1080 × 1350)
// Look wie die Wochen-Karussells (bild.js); Texte unten direkt in BEITRAEGE ändern.
const path = require('path');
const { B, H, INK, esc, logo, pfeil, schlussFolie, ICON_SPEICHERN, ICON_TEILEN, ICON_FOLGEN, rendern } = require('./bild');

const ICON_NACHRICHT = '<path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 2-2z"></path>';
const ICON_LINK = '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"></path><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"></path>';

// Titelbild: farbiger Grund, großer Titel, Sticker-Chips, unten „nach links wischen“
function deckblatt(d) {
  const drehung = [-3, 2, -2, 3];
  const chips = d.chips.map(([text, farbe], i) => `<div style="transform: rotate(${drehung[i % 4]}deg); background: ${farbe}; border: 6px solid ${INK}; border-radius: 999px; padding: 14px 34px; font-weight: 900; font-size: 40px; box-shadow: 8px 10px 0 rgba(0,0,0,.16)">${esc(text)}</div>`).join('');
  return `<div id="folie" style="width: ${B}px; height: ${H}px; box-sizing: border-box; padding: 88px 84px; background: ${d.grund}; display: flex; flex-direction: column; justify-content: space-between; font-family: 'Nunito', sans-serif; color: ${INK}; overflow: hidden">
<div style="display: flex; justify-content: space-between; align-items: center">${logo(true)}
<div style="transform: rotate(4deg); background: #ffc93c; border: 6px solid ${INK}; border-radius: 28px; padding: 18px 32px 12px; box-shadow: 10px 12px 0 rgba(0,0,0,.16); font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 46px; line-height: 1">${esc(d.sticker)}</div></div>
<div style="display: flex; flex-direction: column; gap: 22px">
<div style="font-weight: 900; font-size: 40px; letter-spacing: 3px; text-transform: uppercase; color: #ffffff">${esc(d.kopf)}</div>
<h1 style="margin: 0; font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: ${d.titelGroesse || 150}px; line-height: .95; letter-spacing: -3px; color: #ffffff">${esc(d.titel)}</h1>
<div style="display: flex; flex-wrap: wrap; gap: 22px; margin-top: 26px">${chips}</div></div>
<div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 6px solid ${INK}; border-radius: 44px; padding: 30px 30px 30px 48px; box-shadow: 10px 12px 0 rgba(0,0,0,.16)">
<div style="display: flex; flex-direction: column; gap: 4px">
<div style="font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 60px; line-height: 1.05">${esc(d.unten)}</div>
<div style="font-weight: 800; font-size: 34px; color: #5f5f6b">nach links wischen</div></div>
<div style="width: 120px; height: 120px; border-radius: 999px; background: #ffc93c; border: 6px solid ${INK}; display: flex; align-items: center; justify-content: center">${pfeil(64, 2.8)}</div></div></div>`;
}

// Inhaltsbild: wie ein Tipp aus dem Wochen-Karussell, aber mit freiem Text statt Wann/Wo/Alter
function karte(k, nr, von) {
  const kreis = k.farbe === GELB ? '#ffffff' : GELB; // gelber Kreis auf gelbem Streifen wäre unsichtbar
  return `<div id="folie" style="width: ${B}px; height: ${H}px; box-sizing: border-box; padding: 80px 84px; background: #fff6ea; display: flex; flex-direction: column; gap: 44px; font-family: 'Nunito', sans-serif; color: ${INK}; overflow: hidden">
<div style="display: flex; justify-content: space-between; align-items: center">
<div style="background: #ffffff; border: 5px solid ${INK}; border-radius: 999px; padding: 12px 30px; font-weight: 900; font-size: 36px">${nr} von ${von}</div>${logo(false)}</div>
<div id="karte" style="flex-grow: 1; min-height: 0; display: flex; flex-direction: column; background: #ffffff; border: 6px solid ${INK}; border-radius: 48px; box-shadow: 12px 14px 0 rgba(0,0,0,.16); overflow: hidden">
<div style="height: 280px; flex-shrink: 0; background: ${k.farbe}; border-bottom: 6px solid ${INK}; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 48px 40px; box-sizing: border-box">
<div style="background: #ffffff; border: 5px solid ${INK}; border-radius: 999px; padding: 10px 30px; font-weight: 900; font-size: 38px">${esc(k.label)}</div>
<div style="width: 190px; height: 190px; border-radius: 999px; background: ${kreis}; border: 6px solid ${INK}; box-shadow: 8px 10px 0 rgba(0,0,0,.16); display: flex; align-items: center; justify-content: center; font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 130px; line-height: 1; padding-top: 14px; box-sizing: border-box; transform: rotate(-6deg)">${nr}</div></div>
<div style="padding: 48px 48px 44px; display: flex; flex-direction: column; gap: 26px; flex-grow: 1">
<h2 id="titel" style="margin: 0; font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 104px; line-height: .98; letter-spacing: -2px; overflow-wrap: break-word">${esc(k.titel)}</h2>
<p style="margin: 0; font-weight: 700; font-size: 40px; line-height: 1.32; color: #4a4a58">${esc(k.text)}</p>
<div style="margin-top: auto; align-self: flex-start; background: #eaf4fc; border: 4px solid ${INK}; border-radius: 22px; padding: 14px 26px; font-weight: 900; font-size: 34px; line-height: 1.2">${esc(k.hinweis)}</div></div></div>
<div style="display: flex; justify-content: center; align-items: center; gap: 14px; font-weight: 900; font-size: 36px"><span>${esc(k.fuss || 'Mehr auf kindo.at')}</span>${pfeil(40, 2.8)}</div></div>`;
}

const BLAU = '#2f9ae0', KORALLE = '#e8654f', ROSA = '#f58fb0', GRUEN = '#7cc552', LILA = '#a78be0', TUERKIS = '#4bc0b8', GELB = '#ffc93c';

const BEITRAEGE = {
  'was-ist-kindo': {
    deckblatt: { grund: BLAU, sticker: 'Kurz erklärt', kopf: 'Hallo, wir sind KinDo', titel: 'Was ist KinDo?',
      chips: [['Termine', KORALLE], ['Ausflüge', GRUEN], ['Familiencafés', ROSA], ['Museen', TUERKIS]],
      unten: '3 Dinge, die KinDo kann' },
    karten: [
      { farbe: KORALLE, label: 'Termine', titel: 'Was heute los ist',
        text: 'Theater, Basteln, Führungen, Feste: Wir sammeln die Kinder-Termine vieler Wiener Veranstalter an einem Ort – jeden Tag neu.',
        hinweis: 'Heute · Morgen · Wochenende · gratis' },
      { farbe: GRUEN, label: 'Orte', titel: 'Ausflüge & Lieblingsorte',
        text: 'Familiencafés, Indoorspielplätze, Spielplätze, Museen, Bäder und Büchereien – auch für Regentage und den Kindergeburtstag.',
        hinweis: 'Auf der Karte, nach Bezirk' },
      { farbe: LILA, label: 'Für euch', titel: 'Passend zu euren Kindern',
        text: 'Alter der Kinder und euer Zuhause einstellen – KinDo sortiert die Termine nach Alter und Nähe.',
        hinweis: 'Filter nach Alter, Bezirk und Thema' },
    ],
    schluss: { mehr: 'Kostenlos und ohne Konto', zeile: 'Alle Termine und Orte für Familien in Wien',
      kacheln: [[ICON_SPEICHERN, 'Speichern', 'für später'], [ICON_TEILEN, 'Teilen', 'mit anderen Eltern'],
        [ICON_FOLGEN, 'Folgen', 'jeden Montag und Donnerstag neue Tipps']] },
  },
  'regentage': {
    deckblatt: { grund: BLAU, sticker: 'Für jedes Wetter', kopf: 'Dauerbrenner für Wien', titel: '5 Ideen für Regentage',
      chips: [['Indoor', KORALLE], ['Museum', TUERKIS], ['Baden', GELB], ['Theater', LILA]],
      unten: '5 Ideen für euch' },
    karten: [
      { farbe: KORALLE, label: 'Toben', titel: 'Indoorspielplatz',
        text: 'Klettern, rutschen, toben – überdacht und wetterfest. Viele haben einen eigenen Bereich für die Kleinsten.',
        hinweis: 'Auf kindo.at: Orte › Indoorspielplätze' },
      { farbe: TUERKIS, label: 'Entdecken', titel: 'Museum zum Mitmachen',
        text: 'Mitmachstationen, Kinderführungen und Werkstätten: Museen, in denen Kindern nicht langweilig wird.',
        hinweis: 'Auf kindo.at: Orte › Museen' },
      { farbe: BLAU, label: 'Planschen', titel: 'Ab ins Hallenbad',
        text: 'Wenn es draußen schüttet, wird drinnen geplanscht – am besten in einem Bad mit Kinderbecken.',
        hinweis: 'Auf kindo.at: Orte › Schwimmbäder' },
      { farbe: GRUEN, label: 'Schmökern', titel: 'In die Bücherei',
        text: 'Bilderbücher anschauen, in Ruhe stöbern und ein paar neue Geschichten mit nach Hause nehmen.',
        hinweis: 'Auf kindo.at: Orte › Bibliotheken' },
      { farbe: LILA, label: 'Staunen', titel: 'Kindertheater',
        text: 'Puppen-, Figuren- und Erzähltheater: kurze Stücke, bei denen schon die Kleinen gebannt zuschauen.',
        hinweis: 'Auf kindo.at: Termine › Theater' },
    ],
    schluss: { mehr: 'Noch mehr Regen-Ideen?', zeile: 'Orte und Termine für jedes Wetter in Wien',
      kacheln: [[ICON_SPEICHERN, 'Speichern', 'für den nächsten Regentag'], [ICON_TEILEN, 'Teilen', 'mit anderen Eltern'],
        [ICON_FOLGEN, 'Folgen', 'jeden Montag und Donnerstag neue Tipps']] },
  },
  'veranstalter': {
    deckblatt: { grund: KORALLE, sticker: 'Für Veranstalter', kopf: 'Theater, Museen, Vereine …', titel: 'So kommt euer Termin auf KinDo',
      titelGroesse: 130, chips: [['Theater', LILA], ['Museum', TUERKIS], ['Bücherei', GRUEN], ['Verein', GELB]],
      unten: 'In 3 Schritten' },
    karten: [
      { farbe: TUERKIS, label: 'Schritt', titel: 'Programm online?',
        text: 'Stehen eure Kinder-Termine auf eurer Webseite? Dann kann KinDo sie oft automatisch übernehmen – jeden Tag aktuell.',
        hinweis: 'Ein Link zum Programm reicht' },
      { farbe: GELB, label: 'Schritt', titel: 'Schreibt uns',
        text: 'Auf der Startseite von kindo.at auf „Vorschlag“ tippen, „Veranstaltung“ wählen und den Link schicken. Oder hier per Nachricht.',
        hinweis: 'kindo.at › Vorschlag › Veranstaltung' },
      { farbe: GRUEN, label: 'Schritt', titel: 'Wir nehmen euch auf',
        text: 'Wir schauen uns euer Programm an. Gebt eine E-Mail an, dann melden wir uns bei Fragen.',
        hinweis: 'Eure Termine für Familien in ganz Wien' },
    ],
    schluss: { mehr: 'Fragen? Schreibt uns!', zeile: 'Wir freuen uns über jedes Kinderprogramm in Wien',
      kacheln: [[ICON_LINK, 'Vorschlag', 'auf kindo.at'], [ICON_NACHRICHT, 'Nachricht', 'hier auf Instagram'],
        [ICON_TEILEN, 'Teilen', 'mit anderen Veranstaltern']] },
  },
};

async function main() {
  const nur = process.argv[2];
  for (const [name, b] of Object.entries(BEITRAEGE)) {
    if (nur && nur !== name) continue;
    const von = b.karten.length;
    const folien = [deckblatt(b.deckblatt), ...b.karten.map((k, i) => karte(k, i + 1, von)), schlussFolie(b.schluss)];
    await rendern(folien, path.join(__dirname, 'beitraege', 'profil', name));
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
