// node --test   (prüft die Kategorie-Farben, ohne Bilder zu erzeugen)
const test = require('node:test');
const assert = require('node:assert');
const { FARBEN } = require('./bild');

test('jede Kategorie der Routinen hat ihre eigene Farbe', () => {
  const kategorien = ['Basteln', 'Theater', 'Draußen', 'Museum', 'Feste', 'Musik', 'Kino', 'Sport', 'Lesen',
    'Ausflug', 'Zaubern', 'Tanzen', 'Schwimmen'];
  for (const k of kategorien) assert.ok(FARBEN[k], `${k} hat keine Farbe`);
  const farben = Object.values(FARBEN);
  assert.strictEqual(new Set(farben).size, farben.length, 'zwei Kategorien teilen sich eine Farbe');
});
