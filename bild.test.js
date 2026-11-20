// node --test   (prüft die Kategorie-Farben, ohne Bilder zu erzeugen)
const test = require('node:test');
const assert = require('node:assert');
const { FARBEN, titelfarbe, tagesfarbe } = require('./bild');

test('Werkstatt-Farbe: nie wie Wochen-/Wochenend-Tipps, nie zwei gleiche Tage hintereinander', () => {
  const tag = i => new Date(Date.parse('2026-11-16') + i * 864e5).toISOString().slice(0, 10); // ab Mo 16.11.
  // Wie im Profil: Mo Wochen-Tipps, Fr/Sa Wochenend-Tipps (bild.js), sonst Werkstatt – über 8 Wochen
  const farbe = i => { const d = tag(i), w = i % 7; return w === 0 ? titelfarbe(`woche-${d}`, 'woche') : w === 4 ? titelfarbe(d, 'wochenende') : tagesfarbe(d); };
  for (let i = 1; i < 56; i++) assert.notStrictEqual(farbe(i), farbe(i - 1), `${tag(i - 1)} und ${tag(i)} haben dieselbe Farbe`);
  assert.notStrictEqual(tagesfarbe('2026-11-17'), '#e8654f', 'Di 17.11. wäre wieder rot');
});

test('jede Kategorie der Routinen hat ihre eigene Farbe', () => {
  const kategorien = ['Basteln', 'Theater', 'Draußen', 'Museum', 'Feste', 'Musik', 'Kino', 'Sport', 'Lesen',
    'Ausflug', 'Zaubern', 'Tanzen', 'Schwimmen'];
  for (const k of kategorien) assert.ok(FARBEN[k], `${k} hat keine Farbe`);
  const farben = Object.values(FARBEN);
  assert.strictEqual(new Set(farben).size, farben.length, 'zwei Kategorien teilen sich eine Farbe');
});
