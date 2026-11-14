const test = require('node:test');
const assert = require('node:assert');
const { wetterText, pruefePost, pruefeText } = require('./posten.js');

test('Wettertext nennt Tag, Temperatur, Wetter und ab 30 % das Regenrisiko', () => {
  const t = wetterText({ time: ['2026-11-14', '2026-11-15'], temperature_2m_max: [8.4, 7.1], weather_code: [1, 61], precipitation_probability_max: [0, 80] });
  assert.strictEqual(t, 'Laut Vorhersage: Samstag 8 °C und sonnig, Sonntag 7 °C und Regen (Regenrisiko 80 %). Plan B also besser griffbereit halten!');
  const trocken = wetterText({ time: ['2026-11-14'], temperature_2m_max: [8], weather_code: [3], precipitation_probability_max: [10] });
  assert.strictEqual(trocken, 'Laut Vorhersage: Samstag 8 °C und wolkig. Sieht nach Plan A aus!');
});

test('Beitrag braucht JPEG-Bilder 01.jpg … ohne Lücke und gültige Markierungen', () => {
  assert.doesNotThrow(() => pruefePost({ text: 'x', markierungen: [{ bild: 2, name: 'hausdesmeeres' }] }, ['01.jpg', '02.jpg']));
  assert.throws(() => pruefePost({ text: 'x' }, ['01.png']), /nur JPEG/);
  assert.throws(() => pruefePost({ text: 'x' }, ['01.jpg', '03.jpg']), /ohne Lücke/);
  assert.throws(() => pruefePost({ text: 'x' }, []), /1 bis 20/);
  assert.throws(() => pruefePost({ text: 'x', markierungen: [{ bild: 3, name: 'kindo_wien' }] }, ['01.jpg']), /Bild 3/);
  assert.throws(() => pruefePost({ text: 'x', markierungen: [{ bild: 1, name: '@Kindo Wien' }] }, ['01.jpg']), /kein Instagram-Name/);
  assert.throws(() => pruefePost({ text: 'Wetter: {{wetter}}' }, ['01.jpg']), /wetterTage/);
});

test('Text: kein offener Platzhalter, höchstens 2200 Zeichen und 30 Hashtags', () => {
  assert.throws(() => pruefeText('Hallo {{wetter}}'), /Platzhalter/);
  assert.throws(() => pruefeText('a'.repeat(2201)), /2200/);
  assert.throws(() => pruefeText(Array.from({ length: 31 }, (_, i) => '#tag' + i).join(' ')), /30 Hashtags/);
  assert.doesNotThrow(() => pruefeText('Sonne oder Regen? #wienmitkindern #kindo'));
});
