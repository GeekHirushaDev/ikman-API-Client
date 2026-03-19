/**
 * Tests for filter, cache, and searchPages features
 */
const fs = require('fs');
const path = require('path');
const Cache = require('../src/cache');
const { filterAds, parsePrice } = require('../src/utils');

const mockAds = [
  {
    id: 1,
    title: 'Cheap iPhone',
    price: 'Rs 50,000',
    price_numeric: 50000,
    location: 'Colombo',
    category: 'Electronics'
  },
  {
    id: 2,
    title: 'Mid-range Samsung',
    price: 'Rs 100,000',
    price_numeric: 100000,
    location: 'Kandy',
    category: 'Electronics'
  },
  {
    id: 3,
    title: 'Expensive MacBook',
    price: 'Rs 200,000',
    price_numeric: 200000,
    location: 'Colombo',
    category: 'Electronics'
  },
  {
    id: 4,
    title: 'House in Colombo',
    price: 'Rs 5,000,000',
    price_numeric: 5000000,
    location: 'Colombo',
    category: 'Real Estate'
  },
  {
    id: 5,
    title: 'Apartment in Kandy',
    price: 'Rs 2,000,000',
    price_numeric: 2000000,
    location: 'Kandy',
    category: 'Real Estate'
  }
];

describe('Filter Features', () => {
  test('filterAds: filter by minPrice', () => {
    const filtered = filterAds(mockAds, { minPrice: 100000 });
    expect(filtered.length).toBe(4);
    expect(filtered.every(ad => ad.price_numeric >= 100000)).toBe(true);
  });

  test('filterAds: filter by maxPrice', () => {
    const filtered = filterAds(mockAds, { maxPrice: 100000 });
    expect(filtered.length).toBe(2);
    expect(filtered.every(ad => ad.price_numeric <= 100000)).toBe(true);
  });

  test('filterAds: filter by minPrice and maxPrice range', () => {
    const filtered = filterAds(mockAds, { minPrice: 100000, maxPrice: 200000 });
    expect(filtered.length).toBe(2);
    filtered.forEach((ad) => {
      expect(ad.price_numeric).toBeGreaterThanOrEqual(100000);
      expect(ad.price_numeric).toBeLessThanOrEqual(200000);
    });
  });

  test('filterAds: filter by location', () => {
    const filtered = filterAds(mockAds, { location: 'Colombo' });
    expect(filtered.length).toBe(3);
    expect(filtered.every(ad => ad.location === 'Colombo')).toBe(true);
  });

  test('filterAds: filter by category', () => {
    const filtered = filterAds(mockAds, { category: 'Real Estate' });
    expect(filtered.length).toBe(2);
    expect(filtered.every(ad => ad.category === 'Real Estate')).toBe(true);
  });

  test('filterAds: filter by multiple criteria', () => {
    const filtered = filterAds(mockAds, {
      minPrice: 50000,
      maxPrice: 200000,
      location: 'Colombo',
      category: 'Electronics'
    });
    expect(filtered.length).toBe(2);
    filtered.forEach((ad) => {
      expect(ad.price_numeric).toBeGreaterThanOrEqual(50000);
      expect(ad.price_numeric).toBeLessThanOrEqual(200000);
      expect(ad.location).toBe('Colombo');
      expect(ad.category).toBe('Electronics');
    });
  });

  test('filterAds: no matching results', () => {
    const filtered = filterAds(mockAds, {
      minPrice: 10000000,
      maxPrice: 20000000
    });
    expect(filtered.length).toBe(0);
  });
});

describe('Cache Features', () => {
  let cacheDir;

  beforeEach(() => {
    // Use a test cache directory
    cacheDir = path.join(__dirname, '.test-cache');
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true });
    }
  });

  test('Cache: create cache directory', () => {
    const cache = new Cache({ cacheDir });
    expect(fs.existsSync(cache.cacheDir)).toBe(true);
  });

  test('Cache: set and get data', () => {
    const cache = new Cache({ cacheDir, cache: true });
    const testData = mockAds.slice(0, 2);

    cache.set('pixel', testData, { sortBy: 'price-asc' });
    const retrievedData = cache.get('pixel', { sortBy: 'price-asc' });

    expect(retrievedData).toEqual(testData);
  });

  test('Cache: return null for non-existent key', () => {
    const cache = new Cache({ cacheDir, cache: true });
    const data = cache.get('nonexistent-keyword', { sortBy: 'price-asc' });
    expect(data).toBeNull();
  });

  test('Cache: different options generate different cache keys', () => {
    const cache = new Cache({ cacheDir, cache: true });
    const testData1 = mockAds.slice(0, 1);
    const testData2 = mockAds.slice(1, 2);

    cache.set('phone', testData1, { sortBy: 'price-asc' });
    cache.set('phone', testData2, { sortBy: 'price-desc' });

    const data1 = cache.get('phone', { sortBy: 'price-asc' });
    const data2 = cache.get('phone', { sortBy: 'price-desc' });

    expect(data1).toEqual(testData1);
    expect(data2).toEqual(testData2);
  });

  test('Cache: disabled cache returns null', () => {
    const cache = new Cache({ cacheDir, cache: false });
    cache.set('pixel', mockAds, { sortBy: 'price-asc' });
    const data = cache.get('pixel', { sortBy: 'price-asc' });

    expect(data).toBeNull();
  });

  test('Cache: clear all cache', () => {
    const cache = new Cache({ cacheDir, cache: true });
    cache.set('pixel', mockAds, { sortBy: 'price-asc' });
    cache.set('samsung', mockAds, { sortBy: 'price-desc' });

    let info = cache.info();
    expect(info.files).toBe(2);

    cache.clear();
    info = cache.info();
    expect(info.files).toBe(0);
  });

  test('Cache: get info', () => {
    const cache = new Cache({ cacheDir, cache: true });
    cache.set('pixel', mockAds, { sortBy: 'price-asc' });

    const info = cache.info();
    expect(info.files).toBe(1);
    expect(info.size).toBeGreaterThan(0);
    expect(info.dir).toBe(cache.cacheDir);
  });

  test('Cache: TTL expiration (immediate)', async () => {
    const cache = new Cache({ cacheDir, cache: true, cacheTTL: 1 });
    cache.set('pixel', mockAds, { sortBy: 'price-asc' });

    const dataBeforeExpiry = cache.get('pixel', { sortBy: 'price-asc' });
    expect(dataBeforeExpiry).toEqual(mockAds);

    await new Promise((resolve) => {
      setTimeout(resolve, 1100);
    });

    const dataAfterExpiry = cache.get('pixel', { sortBy: 'price-asc' });
    expect(dataAfterExpiry).toBeNull();
  });
});

describe('parsePrice utility', () => {
  test('parsePrice: parse Rupee formatted price', () => {
    expect(parsePrice('Rs 50,000')).toBe(50000);
    expect(parsePrice('Rs 1,000,000')).toBe(1000000);
  });

  test('parsePrice: parse numeric price', () => {
    expect(parsePrice(50000)).toBe(50000);
    expect(parsePrice(1000000)).toBe(1000000);
  });

  test('parsePrice: handle null/undefined', () => {
    expect(parsePrice(null)).toBe(Infinity);
    expect(parsePrice(undefined)).toBe(Infinity);
  });

  test('parsePrice: parse string numbers', () => {
    expect(parsePrice('50000')).toBe(50000);
    expect(parsePrice('1000000')).toBe(1000000);
  });
});
