// Veröffentlicht einen vorbereiteten Beitrag direkt über die Instagram-Schnittstelle (ohne Metricool).
// Aufruf: node posten.js beitraege/claude/<id>            → postet sofort
//         node posten.js beitraege/claude/<id> --probe    → prüft Schlüssel, Bilder und Text, postet nichts
// Ordner: post.json ({ "text", "markierungen": [{ "bild", "name", "x", "y" }], "wetterTage": ["JJJJ-MM-TT", …] })
// und 01.jpg, 02.jpg … (ein Bild = Einzelbild, mehrere = Karussell; die Schnittstelle nimmt nur JPEG).
// „{{wetter}}“ im Text wird beim Posten durch die aktuelle Vorhersage für Wien ersetzt (Open-Meteo).
// Ablauf: Ordner committen und pushen (Instagram holt die Bilder von raw.githubusercontent.com),
// veröffentlichen, gepostet.json schreiben, wieder committen. Liegt gepostet.json schon da, bricht der Lauf ab.
// Schlüssel: META_POST_TOKEN in ~/.config/kindo-meta/.env – nie ins Repo, nie ausgeben.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const GRAPH = 'https://graph.facebook.com';
const IG = '17841461607921211'; // @kindo_wien
const ROH = 'https://raw.githubusercontent.com/clem581/kindo-social/main/';
const NAME = /^[a-z0-9._]{1,30}$/;
const TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
// WMO-Wettercodes (Open-Meteo) in Worte
const wetterWort = c => c <= 1 ? 'sonnig' : c <= 3 ? 'wolkig' : c <= 48 ? 'neblig' : c <= 57 ? 'Nieselregen' : c <= 67 ? 'Regen'
  : c <= 77 ? 'Schnee' : c <= 82 ? 'Regenschauer' : c <= 86 ? 'Schneeschauer' : 'Gewitter';
const pause = ms => new Promise(r => setTimeout(r, ms));

function wetterText(daily) {
  const teile = daily.time.map((t, i) => {
    const regen = daily.precipitation_probability_max[i];
    return `${TAGE[new Date(t + 'T12:00:00Z').getUTCDay()]} ${Math.round(daily.temperature_2m_max[i])} °C und ${wetterWort(daily.weather_code[i])}`
      + (regen >= 30 ? ` (Regenrisiko ${regen} %)` : '');
  });
  const nass = daily.precipitation_probability_max.some(p => p >= 50);
  return `Laut Vorhersage: ${teile.join(', ')}. ${nass ? 'Plan B also besser griffbereit halten!' : 'Sieht nach Plan A aus!'}`;
}

function pruefePost(post, bilder) {
  if (!post || typeof post.text !== 'string' || !post.text.trim()) throw new Error('post.json: text fehlt');
  if (bilder.length < 1 || bilder.length > 10) throw new Error('1 bis 10 Bilder nötig (01.jpg, 02.jpg …)');
  if (bilder.some((b, i) => b !== String(i + 1).padStart(2, '0') + '.jpg')) throw new Error('Bilder müssen 01.jpg, 02.jpg … ohne Lücke heißen (nur JPEG)');
  for (const m of post.markierungen || []) {
    if (!NAME.test(m.name || '')) throw new Error(`Markierung "${m.name}" ist kein Instagram-Name`);
    if (!(m.bild >= 1 && m.bild <= bilder.length)) throw new Error(`Markierung ${m.name}: Bild ${m.bild} gibt es nicht`);
  }
  if (post.text.includes('{{wetter}}') && !(Array.isArray(post.wetterTage) && post.wetterTage.length)) throw new Error('{{wetter}} im Text, aber keine wetterTage');
}

function pruefeText(text) {
  if (text.includes('{{')) throw new Error('Platzhalter im Text nicht ersetzt');
  if (text.length > 2200) throw new Error(`Text hat ${text.length} Zeichen, erlaubt sind 2200`);
  if ((text.match(/#[\p{L}\p{N}_]+/gu) || []).length > 30) throw new Error('Mehr als 30 Hashtags');
}

function schluessel() {
  const env = fs.readFileSync(path.join(os.homedir(), '.config', 'kindo-meta', '.env'), 'utf8');
  const m = env.match(/^\s*META_POST_TOKEN\s*=\s*["']?([A-Za-z0-9]+)["']?\s*$/m);
  if (!m) throw new Error('META_POST_TOKEN fehlt in ~/.config/kindo-meta/.env');
  return m[1];
}

// Fehlermeldungen enthalten nie den Schlüssel: nur Metas Text und Code
async function graph(pfad, params, senden = false) {
  const body = new URLSearchParams(params);
  const res = senden ? await fetch(GRAPH + pfad, { method: 'POST', body }) : await fetch(GRAPH + pfad + '?' + body);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error('Instagram: ' + (json.error ? `${json.error.message} (Code ${json.error.code})` : `HTTP ${res.status}`));
  return json;
}

async function wetterVorhersage(tage) {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=48.2085&longitude=16.3721&timezone=Europe%2FVienna'
    + `&daily=weather_code,temperature_2m_max,precipitation_probability_max&start_date=${tage[0]}&end_date=${tage[tage.length - 1]}`;
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.daily) throw new Error(`Keine Wettervorhersage bekommen (Open-Meteo, HTTP ${res.status})`);
  return wetterText(json.daily);
}

// Container fertig verarbeitet? Instagram lädt die Bilder selbst herunter
async function fertig(id, token) {
  for (let i = 0; i < 40; i++) {
    const { status_code: s } = await graph('/' + id, { fields: 'status_code', access_token: token });
    if (s === 'FINISHED') return;
    if (s === 'ERROR' || s === 'EXPIRED') throw new Error(`Instagram konnte das Bild nicht verarbeiten (${s})`);
    await pause(3000);
  }
  throw new Error('Instagram braucht zu lange für die Bilder – nichts veröffentlicht');
}

async function erreichbar(urls) {
  for (const u of urls) {
    for (let i = 0; !(await fetch(u, { method: 'HEAD' })).ok; i++) {
      if (i >= 30) throw new Error('Bild nicht öffentlich erreichbar: ' + u);
      await pause(3000);
    }
  }
}

const git = args => execFileSync('git', args, { cwd: __dirname, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
function committen(rel, nachricht) {
  git(['add', '--', rel]);
  if (!git(['status', '--porcelain', '--', rel]).trim()) return;
  git(['commit', '-m', nachricht, '--', rel]);
  try { git(['push']); } catch { git(['pull', '--rebase']); git(['push']); }
}

async function main() {
  const [ordner, schalter] = process.argv.slice(2);
  if (!ordner) throw new Error('Aufruf: node posten.js beitraege/claude/<id> [--probe]');
  const dir = path.resolve(__dirname, ordner);
  const rel = path.relative(__dirname, dir).split(path.sep).join('/');
  if (rel.startsWith('..') || !fs.existsSync(path.join(dir, 'post.json'))) throw new Error(`Kein vorbereiteter Beitrag: ${ordner}`);
  if (fs.existsSync(path.join(dir, 'gepostet.json'))) throw new Error(`Schon gepostet (${rel}/gepostet.json) – nichts getan.`);
  const post = JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf8').replace(/^﻿/, ''));
  const bilder = fs.readdirSync(dir).filter(f => /^\d\d\.(jpe?g|png)$/i.test(f)).sort();
  pruefePost(post, bilder);
  let text = post.text;
  if (text.includes('{{wetter}}')) text = text.replace('{{wetter}}', await wetterVorhersage(post.wetterTage));
  pruefeText(text);
  const token = schluessel();
  const lim = (await graph(`/${IG}/content_publishing_limit`, { fields: 'quota_usage,config', access_token: token })).data[0];
  console.log(`${rel}: ${bilder.length === 1 ? 'Einzelbild' : bilder.length + ' Bilder (Karussell)'}, ${text.length} Zeichen; `
    + `heute ${lim.quota_usage} von ${lim.config.quota_total} Beiträgen verbraucht`);
  if (schalter === '--probe') { console.log('\n' + text); return; }

  committen(rel, `Instagram direkt: ${rel}`);
  const urls = bilder.map(b => ROH + rel + '/' + b);
  await erreichbar(urls);
  const tags = n => (post.markierungen || []).filter(m => m.bild === n).map(m => ({ username: m.name, x: m.x ?? 0.5, y: m.y ?? 0.5 }));
  const mitTags = (n, p) => (tags(n).length ? { ...p, user_tags: JSON.stringify(tags(n)) } : p);
  let container;
  if (urls.length === 1) {
    container = (await graph(`/${IG}/media`, mitTags(1, { image_url: urls[0], caption: text, access_token: token }), true)).id;
  } else {
    const kinder = [];
    for (const [i, u] of urls.entries()) kinder.push((await graph(`/${IG}/media`, mitTags(i + 1, { image_url: u, is_carousel_item: 'true', access_token: token }), true)).id);
    for (const k of kinder) await fertig(k, token);
    container = (await graph(`/${IG}/media`, { media_type: 'CAROUSEL', children: kinder.join(','), caption: text, access_token: token }, true)).id;
  }
  await fertig(container, token);
  const media = (await graph(`/${IG}/media_publish`, { creation_id: container, access_token: token }, true)).id;
  // sofort festhalten, damit ein zweiter Lauf nie doppelt postet
  fs.writeFileSync(path.join(dir, 'gepostet.json'), JSON.stringify({ media_id: media, gepostet: new Date().toISOString(), text }, null, 2) + '\n');
  const { permalink } = await graph('/' + media, { fields: 'permalink', access_token: token });
  fs.writeFileSync(path.join(dir, 'gepostet.json'), JSON.stringify({ media_id: media, permalink, gepostet: new Date().toISOString(), text }, null, 2) + '\n');
  committen(rel, `Instagram direkt gepostet: ${rel}`);
  console.log('Gepostet: ' + permalink);
}

module.exports = { wetterText, pruefePost, pruefeText };

if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });
