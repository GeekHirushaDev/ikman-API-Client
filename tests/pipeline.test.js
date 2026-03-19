const fs = require('fs');
const path = require('path');
const {
  canonicalizeAd,
  dedupeAds,
  applyAdPlugins,
  runResultPlugins,
  exportToJSONL
} = require('../src/utils');
const { normalizeLocationPlugin, scoreByPricePlugin } = require('../src/plugins');

describe('Canonicalization and duplicate detection', () => {
  test('canonicalizeAd adds canonical fields', () => {
    const ad = canonicalizeAd({
      title: '  iPhone 13  ',
      location: ' Colombo ',
      price_numeric: 120000
    });

    expect(ad.canonical_title).toBe('iphone 13');
    expect(ad.canonical_location).toBe('colombo');
    expect(ad.canonical_price).toBe(120000);
    expect(ad.canonical_key).toBe('iphone 13|colombo|120000');
  });

  test('dedupeAds removes repost duplicates by canonical key', () => {
    const input = [
      canonicalizeAd({ id: '1', title: 'iPhone 13', location: 'Colombo', price_numeric: 120000 }),
      canonicalizeAd({ id: '2', title: ' iPhone 13 ', location: ' colombo ', price_numeric: 120000 }),
      canonicalizeAd({ id: '3', title: 'iPhone 13 Pro', location: 'Colombo', price_numeric: 180000 })
    ];

    const deduped = dedupeAds(input);
    expect(deduped).toHaveLength(2);
    expect(deduped[0].id).toBe('1');
    expect(deduped[1].id).toBe('3');
  });
});

describe('Plugin pipeline', () => {
  test('applies ad transform plugins and result plugins', () => {
    const ads = [
      { id: '1', title: 'A', location: ' Colombo ', price: 'Rs 100,000', price_numeric: 100000 },
      { id: '2', title: 'B', location: ' Kandy ', price: 'Rs 200,000', price_numeric: 200000 }
    ];

    const plugins = [
      normalizeLocationPlugin(),
      scoreByPricePlugin({ min: 0, max: 200000 }),
      {
        name: 'keep-scored',
        transformResults(rows) {
          return rows.filter((row) => row.score >= 20);
        }
      }
    ];

    const transformed = applyAdPlugins(ads, plugins, {
      keyword: 'phone',
      mode: 'search',
      options: {}
    });

    const finalRows = runResultPlugins(transformed, plugins, {
      keyword: 'phone',
      mode: 'search',
      options: {}
    });

    expect(finalRows).toHaveLength(1);
    expect(finalRows[0].location_normalized).toBe('colombo');
    expect(finalRows[0].score).toBeGreaterThanOrEqual(20);
  });
});

describe('JSONL export', () => {
  const jsonlPath = path.join(__dirname, 'tmp-export.jsonl');

  afterEach(() => {
    if (fs.existsSync(jsonlPath)) {
      fs.unlinkSync(jsonlPath);
    }
  });

  test('exportToJSONL writes one JSON object per line', async () => {
    const rows = [
      { id: '1', title: 'Ad 1' },
      { id: '2', title: 'Ad 2' }
    ];

    await exportToJSONL(rows, jsonlPath);

    const content = fs.readFileSync(jsonlPath, 'utf8').trim();
    const lines = content.split('\n');

    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).id).toBe('1');
    expect(JSON.parse(lines[1]).id).toBe('2');
  });
});
