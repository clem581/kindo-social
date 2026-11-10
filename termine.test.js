// node --test   (prüft die Kurs-Auswahl von termine.js ohne Abruf von kindo.at)
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { naechsteWoche, kursStart, schonGezeigt, stempel } = require('./termine');

// Ein Ordner wie das Repo, mit einem Karussell und dem Story-Verlauf
function testOrdner() {
  const o = fs.mkdtempSync(path.join(os.tmpdir(), 'kindo-social-'));
  fs.mkdirSync(path.join(o, 'beitraege'));
  fs.mkdirSync(path.join(o, 'story'));
  fs.writeFileSync(path.join(o, 'beitraege', '2026-11-14.json'), JSON.stringify({ tipps: [
    { titel: 'Der kleine Prinz', verifiziert: 'Der kleine Prinz – Theater für alle ab 6' },
    { titel: 'Laternenumzug' },
  ] }));
  fs.writeFileSync(path.join(o, 'story', 'verlauf.txt'), '2026-11-12 | https://www.kindo.at/veranstaltungen/1 | Kasperl im Park\n');
  return o;
}
const karte = titel => `<div class="chip-row"><span class="chip chip-verifiziert">Verifiziert</span></div><h3 class="card-title"><a href="/veranstaltungen/5">${titel}</a></h3>`;

test('verifiziert: schon im Karussell bzw. in der Story?', () => {
  const o = testOrdner();
  assert.strictEqual(schonGezeigt('Der kleine Prinz – Theater für alle ab 6', 'feed', o), 'beitraege/2026-11-14.json');
  assert.strictEqual(schonGezeigt('Laternenumzug im Park', 'feed', o), 'beitraege/2026-11-14.json'); // gekürzter Titel
  assert.strictEqual(schonGezeigt('Kasperl im Park', 'feed', o), '');
  assert.strictEqual(schonGezeigt('Kasperl im Park', 'story', o), 'Story 2026-11-12');
  assert.strictEqual(schonGezeigt('Der kleine Prinz – Theater für alle ab 6', 'story', o), '');
});

test('verifiziert: Kennzeichen je Karte, dasselbe Stück nur einmal', () => {
  const o = testOrdner();
  const gesehen = new Set();
  assert.strictEqual(stempel('<span class="chip chip-cat">Theater</span>', 'feed', gesehen, o), '');
  assert.match(stempel(karte('Zauberflöte für Kinder'), 'feed', gesehen, o), /muss rein/);
  assert.match(stempel(karte('Zauberflöte für Kinder'), 'feed', gesehen, o), /nicht nochmal/); // zweiter Termin
  assert.match(stempel(karte('Der kleine Prinz – Theater für alle ab 6'), 'feed', gesehen, o), /schon gezeigt \(beitraege\/2026-11-14\.json\)/);
});

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
