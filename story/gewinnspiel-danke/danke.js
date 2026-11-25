// Danke-Story nach dem Newsletter-Gewinnspiel (1080 × 1920), gleicher Look wie gewinnspiel.js vom 15.11.
// Aufruf: node danke.js  →  danke/01.png
const path = require('path');
const { B, INK, logo, rendern } = require('C:/Users/ClemensSteinbauer/Privat/kindo-social/bild');

const SH = 1920;
const GELB = '#ffc93c', BLAU = '#2f9ae0';
const svg = (d, gr, sw = 2.2) => `<svg aria-hidden="true" width="${gr}" height="${gr}" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const HERZ = '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"></path>';
const BRIEF = '<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path>';
const SPAM = '<path d="M3 7h18M6 7l1 13h10l1-13M9 7V4h6v3"></path>';
const GESCHENK = '<rect x="3" y="8" width="18" height="4" rx="1"></rect><path d="M12 8v13M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"></path>';

// Eintrittskarte wie in der Gewinnspiel-Story, unten links schräg angeschnitten
const KARTE = 'M26 0H414A26 26 0 0 1 440 26V99A26 26 0 0 0 440 151V224A26 26 0 0 1 414 250H26A26 26 0 0 1 0 224V151A26 26 0 0 0 0 99V26A26 26 0 0 1 26 0Z';
const ticket = `<div style="position: absolute; inset: 0; overflow: hidden; pointer-events: none">
<svg aria-hidden="true" width="440" height="250" viewBox="-8 -8 456 266" style="position: absolute; left: 560px; top: 1600px; overflow: visible; transform: rotate(-8deg)">
<path d="${KARTE}" transform="translate(10 12)" fill="rgba(0,0,0,.16)"></path>
<path d="${KARTE}" fill="${BLAU}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"></path>
<path d="M330 24V226" stroke="${INK}" stroke-width="5" stroke-dasharray="3 14" stroke-linecap="round"></path>
<text x="44" y="118" font-family="'Baloo 2', sans-serif" font-weight="800" font-size="76" fill="#ffffff" stroke="${INK}" stroke-width="2" paint-order="stroke" letter-spacing="-1">BALD</text>
<text x="46" y="182" font-family="'Nunito', sans-serif" font-weight="900" font-size="31" fill="${INK}" letter-spacing="2">MEHR GEWINNE</text></svg></div>`;
const box =(inhalt, bg = '#ffffff') => `<div style="flex-shrink: 0; background: ${bg}; border: 6px solid ${INK}; border-radius: 40px; box-shadow: 12px 14px 0 rgba(0,0,0,.16); padding: 30px 40px 32px; display: flex; flex-direction: column; gap: 12px">${inhalt}</div>`;
const kopf = (d, text, farbe = GELB) => `<div style="display: flex; align-items: center; gap: 20px"><div style="width: 84px; height: 84px; flex-shrink: 0; border-radius: 999px; background: ${farbe}; border: 6px solid ${INK}; display: flex; align-items: center; justify-content: center; transform: rotate(-6deg)">${svg(d, 46, 2.4)}</div>
<div style="font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 56px; line-height: 1">${text}</div></div>`;
const text = t => `<p style="margin: 0; font-weight: 800; font-size: 38px; line-height: 1.25">${t}</p>`;

// Oben 250 px und unten 250 px frei: dort liegen in Instagram Profilbild, Balken und Antwortfeld
const folie = `<div id="folie" style="position: relative; width: ${B}px; height: ${SH}px; box-sizing: border-box; padding: 250px 84px 250px; background: ${GELB}; display: flex; flex-direction: column; gap: 30px; font-family: 'Nunito', sans-serif; color: ${INK}; overflow: hidden">
<div style="display: flex; justify-content: space-between; align-items: center">${logo(true)}
<div style="transform: rotate(4deg); background: #ffffff; border: 6px solid ${INK}; border-radius: 28px; padding: 18px 32px 12px; box-shadow: 10px 12px 0 rgba(0,0,0,.16); font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 46px; line-height: 1">Gewinnspiel</div></div>

<div style="display: flex; align-items: center; gap: 24px; margin-top: 10px">
<h1 style="margin: 0; font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 170px; line-height: .9; letter-spacing: -4px">Danke!</h1>
<div style="transform: rotate(10deg)">${svg(HERZ, 130, 2.2).replace('fill="none"', 'fill="#ff5a5f"')}</div></div>
<p style="margin: -6px 0 0; font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 60px; line-height: 1.02; letter-spacing: -1px">So viele von euch haben mitgemacht – wir sind überwältigt!</p>

${box(`${kopf(BRIEF, 'Gewonnen hat …', BLAU)}
${text('… eine Familie, die schon per E-Mail Bescheid bekommen hat. Viel Spaß im Haus des Meeres!')}
<div style="display: flex; align-items: center; gap: 16px; margin-top: 6px; background: ${GELB}; border: 5px solid ${INK}; border-radius: 26px; padding: 16px 24px"><div style="flex-shrink: 0; display: flex">${svg(SPAM, 50, 2.4)}</div><span style="font-weight: 900; font-size: 34px; line-height: 1.2">Bitte auch im Spam&#8209;Ordner nachsehen – vielleicht wartet die Gewinn-Mail dort!</span></div>`)}

${box(`${kopf(GESCHENK, 'Nicht gewonnen?')}
${text('Kopf hoch: Das nächste Gewinnspiel ist schon in Planung. Bleib dran!')}`)}
${ticket}</div>`;

module.exports = { folie };
if (require.main === module) rendern([folie], path.join(__dirname, 'danke'), SH).catch(e => { console.error(e.message); process.exit(1); });
