// node --test   (prüft die Kurs-Auswahl von termine.js ohne Abruf von kindo.at)
const test = require('node:test');
const assert = require('node:assert');
const { naechsteWoche, kursStart } = require('./termine');

test('nächste Woche: von Samstag, Sonntag und Montag aus', () => {
  assert.deepStrictEqual(naechsteWoche('2026-11-07'), ['2026-11-09', '2026-11-15']);
  assert.deepStrictEqual(naechsteWoche('2026-11-08'), ['2026-11-09', '2026-11-15']);
  assert.deepStrictEqual(naechsteWoche('2026-11-09'), ['2026-11-16', '2026-11-22']);
  assert.deepStrictEqual(naechsteWoche('2026-12-26'), ['2026-12-28', '2027-01-03']);
});

test('Kursbeginn aus dem Kartentext', () => {
  const heute = '2026-11-07';
  assert.strictEqual(kursStart('Musik & Tanz ab 3 J. 15. Bezirk Ballett Mo 15:30–16:30 · 29 Einheiten · ab 9. Nov Studio', heute), '2026-11-09');
  assert.strictEqual(kursStart('Schwimmen Sa 10:00 · 10 Einheiten · ab 13. Jän 2027 Bad', heute), '2027-01-13');
  // Laufender Kurs: nur „bis …“ und eine Anmeldefrist – kein Beginn
  assert.strictEqual(kursStart('Turnen Di 16:00 · bis 12. Dez Preis beim Anbieter Anmeldung ab 9. Nov, 10:00', heute), '');
});
