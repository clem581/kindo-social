const test = require('node:test');
const assert = require('node:assert');
const { storyFolie, pruefen } = require('./story.js');

const s = { datum: '2026-11-26', link: 'https://www.kindo.at/veranstaltungen/282998',
  tipp: { kategorie: 'Theater', titel: 'Das Neinhorn', satz: 'Puppentheater.', wann: 'Do, 16:00 Uhr', wo: 'Puppenpalast, 10. Bezirk', alter: '2–8 Jahre' } };

test('Story nennt Wochentag und Datum, nie heute oder morgen (gilt am Vorabend und am Tag selbst)', () => {
  const html = storyFolie(s);
  assert.match(html, /Tipp für<br>Donnerstag/);
  assert.match(html, />26\. Nov</);
  assert.match(html, /Zur Veranstaltung: Link in der Bio/);
  assert.doesNotMatch(html, /heute|morgen/i);
});

test('Link muss eine Veranstaltung auf kindo.at sein (Ziel von kindo.at/story)', () => {
  assert.doesNotThrow(() => pruefen(s));
  assert.throws(() => pruefen({ ...s, link: 'https://www.kindo.at/' }), /veranstaltungen/);
  assert.throws(() => pruefen({ ...s, link: 'https://boese.example/veranstaltungen/1' }), /veranstaltungen/);
});
