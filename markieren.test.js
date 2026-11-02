// node --test   (prüft die Instagram-Markierungen ohne Abruf)
const test = require('node:test');
const assert = require('node:assert');
const { markierungen, kontenIn } = require('./markieren');

const liste = {
  EKIZ: { instagram: 'ekiz.wien', quelle: 'https://www.ekiz.at', geprueft: '2026-11-02' },
  'Eisring Süd': { instagram: null, quelle: 'https://www.eisringsued.at', geprueft: '2026-11-02' },
};

test('nur Veranstalter aus der Liste werden markiert, auf ihrem eigenen Bild', () => {
  const b = { tipps: [
    { titel: 'A', veranstalter: 'Unbekannt' },
    { titel: 'B', veranstalter: 'EKIZ' },
    { titel: 'C', veranstalter: 'Eisring Süd' },
    { titel: 'D' },
    { titel: 'E', veranstalter: 'EKIZ' },
  ] };
  assert.deepStrictEqual(markierungen(b, liste), {
    carouselTags: { 2: [{ username: 'ekiz.wien', x: 0.5, y: 0.5 }], 5: [{ username: 'ekiz.wien', x: 0.5, y: 0.5 }] },
    erwaehnungen: ['@ekiz.wien'],
    fehlen: ['Unbekannt'],
  });
});

test('Name nur teilweise gleich: nur eindeutige Treffer zählen', () => {
  const l = {
    'Bühne 1 · DSCHUNGEL WIEN, Museumsplatz 1': { instagram: 'dschungelwien' },
    'DSCHUNGEL WIEN, MuseumsQuartier': { instagram: 'dschungelwien' },
    'Schloss Schönbrunn': { instagram: 'schoenbrunnpalace' },
    'Marionettentheater Schloss Schönbrunn': { instagram: 'marionettentheaterwien' },
  };
  const tags = namen => markierungen({ tipps: namen.map(veranstalter => ({ veranstalter })) }, l).erwaehnungen;
  assert.deepStrictEqual(tags(['DSCHUNGEL WIEN']), ['@dschungelwien']);
  assert.deepStrictEqual(tags(['Schloss Schönbrunn']), ['@schoenbrunnpalace']); // genau gleich geht vor
  assert.deepStrictEqual(tags(['Schönbrunn']), []); // passt auf zwei verschiedene Konten
  assert.deepStrictEqual(tags(['Wien']), []); // zu kurz
});

test('ein falsch geschriebener Name in der Liste bricht ab', () => {
  assert.throws(() => markierungen({ tipps: [{ veranstalter: 'X' }] }, { X: { instagram: '@x y' } }));
});

test('Instagram-Konten auf einer Webseite finden', () => {
  const html = '<a href="https://www.instagram.com/Theater_Wien/">Insta</a> <a href="https://instagram.com/p/AbC123">Post</a>'
    + ' <a href="https://www.instagram.com/theater_wien?hl=de">nochmal</a> <a href="https://instagram.com/reel/x">Reel</a>';
  assert.deepStrictEqual(kontenIn(html), ['theater_wien']);
});
