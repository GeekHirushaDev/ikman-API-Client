const { parsePrice, sortAds, filterAds, generateStats, formatPrice } = require('../src/utils');

describe('utils', () => {
  test('parsePrice parses formatted rupee values', () => {
    expect(parsePrice('Rs 2,250,000')).toBe(2250000);
    expect(parsePrice(5000)).toBe(5000);
    expect(parsePrice(null)).toBe(Infinity);
  });

  test('sortAds sorts ascending by price by default', () => {
    const ads = [
      { title: 'B', price: 'Rs 300,000' },
      { title: 'A', price: 'Rs 100,000' }
    ];

    const sorted = sortAds(ads);
    expect(sorted[0].title).toBe('A');
    expect(sorted[1].title).toBe('B');
  });

  test('filterAds applies min and max price', () => {
    const ads = [
      { title: 'A', price: 'Rs 100,000', location: 'Colombo' },
      { title: 'B', price: 'Rs 900,000', location: 'Kandy' },
      { title: 'C', price: 'Rs 1,500,000', location: 'Colombo' }
    ];

    const filtered = filterAds(ads, { minPrice: 200000, maxPrice: 1000000 });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('B');
  });

  test('generateStats returns price aggregates', () => {
    const ads = [
      { price: 'Rs 100,000', location: 'Colombo', category: 'Cars' },
      { price: 'Rs 300,000', location: 'Colombo', category: 'Cars' },
      { price: 'Rs 500,000', location: 'Gampaha', category: 'Property' }
    ];

    const stats = generateStats(ads);
    expect(stats.total).toBe(3);
    expect(stats.min_price).toBe(100000);
    expect(stats.max_price).toBe(500000);
    expect(Math.round(stats.avg_price)).toBe(300000);
  });

  test('formatPrice keeps rupee prefix', () => {
    expect(formatPrice('22000000')).toContain('Rs');
  });
});