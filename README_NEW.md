# ikman-api-client

A clean and practical Node.js client for [ikman.lk](https://ikman.lk).

Use it to:
- Search listings with filtering and reliable sorting
- Stream results page-by-page (memory efficient)
- Cache search results automatically
- Read full details of a single ad
- Process many ad URLs in batch
- Extract images from multiple ads
- Export and analyze results
- Use CLI tool for quick shell searches

[![npm version](https://img.shields.io/npm/v/ikman-api-client.svg)](https://www.npmjs.com/package/ikman-api-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)

---

## 📚 Table of Contents

- [🚀 Why this package?](#-why-this-package)
- [📦 Installation](#-installation)
- [⚡ Quick Start](#-quick-start)
  - [Search with filters](#search-with-filters)
  - [Stream results page-by-page](#stream-results-page-by-page)
  - [Use caching](#use-caching)
  - [CLI tool](#cli-tool)
- [💸 Reliable Price Sorting](#-reliable-price-sorting)
- [🔍 Advanced Filtering](#-advanced-filtering)
- [📡 Streaming API (Memory Efficient)](#-streaming-api-memory-efficient)
- [💾 Caching Results](#-caching-results)
- [🖥️ CLI Tool](#-cli-tool)
- [🧩 API Overview](#-api-overview)
- [🛠️ Utilities](#-utilities)
- [📱 Examples](#-examples)
- [🧪 Local Development](#-local-development)
- [📝 Notes](#-notes)

---

## 🚀 Why this package?

`ikman-api-client` is built to be simple for beginners and useful for production scripts.

- Beginner-friendly API (`search`, `getAd`, `batch`)
- Advanced features (filtering, caching, streaming, CLI)
- Stable retries and timeout controls
- Built-in validation for safer input
- TypeScript definitions included
- Utility helpers for sorting, filtering, stats, and exports

---

## 📦 Installation

```bash
npm install ikman-api-client
```

### For CLI tool (global)
```bash
npm install -g ikman-api-client
```

---

## ⚡ Quick Start

### Search with filters

```js
const { search } = require('ikman-api-client');

async function run() {
  const ads = await search('phone', {
    maxPages: 5,
    sortBy: 'price-asc',
    minPrice: 50000,
    maxPrice: 200000,
    location: 'Colombo',
    category: 'Electronics',
    verbose: true
  });

  console.log(`Found ${ads.length} ads`);
  console.log('Cheapest:', ads[0]?.title, ads[0]?.price);
}

run().catch(console.error);
```

### Stream results page-by-page

```js
const { searchPages } = require('ikman-api-client');

async function run() {
  let totalAds = 0;

  for await (const pageResults of searchPages('car', { maxPages: 10 })) {
    totalAds += pageResults.length;
    console.log(`Page loaded: ${pageResults.length} ads (Total: ${totalAds})`);
    
    // Process each page without loading all in memory
    pageResults.forEach(ad => {
      console.log(`- ${ad.title}: ${ad.price}`);
    });
  }

  console.log(`✅ Total: ${totalAds} ads`);
}

run().catch(console.error);
```

### Use caching

```js
const { search, Cache } = require('ikman-api-client');

async function run() {
  // First call: fetches from ikman and caches
  console.time('First search');
  const ads1 = await search('pixel', {
    maxPages: 5,
    cache: true,  // Enable caching
    cacheTTL: 3600  // 1 hour TTL
  });
  console.timeEnd('First search');

  // Second identical call: instant (from cache)
  console.time('Cached search');
  const ads2 = await search('pixel', {
    maxPages: 5,
    cache: true,
    cacheTTL: 3600
  });
  console.timeEnd('Cached search');

  // Manage cache manually
  const cache = new Cache();
  console.log(cache.info());
  cache.clear();
}

run().catch(console.error);
```

### CLI tool

```bash
# Search with filters
ikman search "pixel phone" --min-price 50000 --max-price 150000

# Stream mode (memory efficient)
ikman search "house" --streaming --limit 100

# Save to file
ikman search "car" -o results.json

# Save as CSV
ikman search "laptop" --csv results.csv

# Cache management
ikman cache info
ikman cache clear
```

---

## 💸 Reliable Price Sorting

ikman upstream sorting can sometimes be inconsistent.

This package enforces client-side fallback sorting for:
- `sortBy: 'price-asc'`
- `sortBy: 'price-desc'`

Returned arrays are correctly ordered by price **without** needing manual `.sort(...)`.

---

## 🔍 Advanced Filtering

Filter results on 4 dimensions:

```js
const { search } = require('ikman-api-client');

const ads = await search('property', {
  // Price range (in Rs)
  minPrice: 1000000,
  maxPrice: 10000000,
  
  // Location filter (partial match)
  location: 'Colombo',
  
  // Category filter (exact match)
  category: 'Real Estate',
  
  sortBy: 'price-asc'
});
```

### How filtering works

- **minPrice/maxPrice**: Numeric price comparison
- **location**: Case-insensitive substring match
- **category**: Exact string match

---

## 📡 Streaming API (Memory Efficient)

For large result sets, use `searchPages()` to process one page at a time:

```js
const { searchPages } = require('ikman-api-client');

for await (const pageAds of searchPages('property', {
  maxPages: 50,
  minPrice: 1000000,
  sortBy: 'price-asc'
})) {
  // pageAds = single page (typically 20-25 results)
  // Process and discard before next page loads
  
  pageAds.forEach(ad => {
    // Your processing logic
  });
}
```

Benefits:
- **Memory efficient**: Only 1 page in memory at a time
- **Responsive**: Start processing while fetching continues
- **Filterable**: Apply filters per-page
- **Sortable**: Respects sort options

---

## 💾 Caching Results

Cache search results to speed up batch operations:

```js
const { search, Cache } = require('ikman-api-client');

// Option 1: Automatic via search()
const ads = await search('pixel', {
  cache: true,        // Enable caching
  cacheTTL: 3600,     // 1 hour expiry (seconds)
  cacheDir: './cache' // Custom cache dir (optional)
});

// Option 2: Manual cache management
const cache = new Cache({
  cacheDir: './.ikman-cache',
  cacheTTL: 7200  // 2 hours
});

// Get cached data
const cached = cache.get('pixel', { sortBy: 'price-asc' });

// Store data manually
cache.set('pixel', adsArray, { sortBy: 'price-asc' });

// Clear all cache
cache.clear();

// View cache stats
console.log(cache.info());
// Output: { size: 2048576, files: 3, dir: '...', sizeGB: '0.00' }
```

Cache keys are generated from:
- Keyword
- sortBy, minPrice, maxPrice, location, category

Same filters = same cache hit ✓

---

## 🖥️ CLI Tool

Global command-line tool for quick searches:

```bash
npm install -g ikman-api-client
ikman search <keyword> [options]
```

### Commands

```bash
# Search examples
ikman search "pixel 8"
ikman search "samsung" --min-price 50000 --max-price 150000
ikman search "house" --location Colombo --sort price-asc

# Streaming mode (memory efficient for large result sets)
ikman search "car" --streaming --limit 50

# Save results
ikman search "laptop" -o results.json
ikman search "phone" --csv results.csv

# Cache management
ikman cache info          # Show cache stats
ikman cache clear         # Clear all cache
ikman cache dir           # Show cache location

# Show info
ikman info                # Package info
ikman examples            # Usage examples
```

### CLI Options

```
--max-pages, -p <n>      Maximum pages (default: 10)
--sort, -s               price-asc | price-desc | date-asc | date-desc | relevance
--min-price <n>          Minimum price filter (Rs)
--max-price <n>          Maximum price filter (Rs)
--location, -l <text>    Location filter
--category, -c <text>    Category filter
--output, -o <file>      Save to JSON file
--csv <file>             Save to CSV file
--limit <n>              Limit results to N items
--streaming              Use streaming mode (memory efficient)
--cache                  Enable caching (default: true)
--verbose, -v            Verbose output (default: true)
```

---

## 🧩 API Overview

### `search(keyword, options)`

Search listings by keyword with optional filters.

**Options:**
- `maxPages` (1-1000, default: 100)
- `sortBy` ('price-asc', 'price-desc', 'date-asc', 'date-desc', 'relevance')
- `minPrice` (number) — Filter by minimum price
- `maxPrice` (number) — Filter by maximum price
- `location` (string) — Filter by location (substring match)
- `category` (string) — Filter by category (exact match)
- `cache` (boolean, default: true) — Enable result caching
- `cacheTTL` (number, default: 3600) — Cache expiry in seconds
- `cacheDir` (string) — Cache directory path
- `timeout` (default: 90000)
- `delay` ({ `min`, `max` })
- `saveToFile` (boolean)
- `fileName` (string)
- `verbose` (boolean)
- `retries` (number)

**Returns** — Array of ads with fields: `id`, `title`, `price`, `price_numeric`, `location`, `link`, `postedTime`, `category`, `seller_type`, `is_urgent`, `is_featured`, `has_images`

---

### `searchPages(keyword, options)`

**Streaming API** — Yields results page-by-page for memory efficiency.

```js
const { searchPages } = require('ikman-api-client');

for await (const pageAds of searchPages('car', {
  maxPages: 50,
  minPrice: 1000000,
  sortBy: 'price-asc',
  verbose: true
})) {
  console.log(`Page: ${pageAds.length} ads`);
  pageAds.forEach(ad => processAd(ad));
}
```

Same options as `search()`. Filters and sorting applied per-page.

---

### `getSearchSummary(keyword, options)`

Reads result count fast without full fetch.

**Returns:**
- `total_count`
- `accessible_count`
- `is_capped`
- `max_accessible_pages`

---

### `getAd(url, options)`

Fetch full ad details from single URL.

**Returns:**
- `title`, `description`, `price`, `category`
- `seller` (name, phone, type)
- `images` (array)
- Metadata (location, posted_at, etc.)

---

### `batch(urls, options)`

Process many ad URLs with queue + retries.

**Options:**
- `concurrency` (1-20, default: 3)
- `delay` (milliseconds)
- `saveToFile` (boolean)
- `fileName` (string)
- `verbose` (boolean)

**Returns:**
```js
{
  results: [{ ad1 }, { ad2 }, ...],
  errors: [{ url, error }, ...],
  stats: { total, success, failed, duration }
}
```

---

### `getImagesFromUrls(urls, options)`

Extract images from multiple ad URLs.

**Returns:**
```js
{
  results: { url1: [img1, img2...], url2: [...] },
  all_images: [img1, img2, img3, ...]  // deduplicated
}
```

---

## 🛠️ Utilities

```js
const { utils, Cache } = require('ikman-api-client');

// Filter results
utils.filterAds(ads, {
  minPrice: 500000,
  maxPrice: 5000000,
  location: 'Colombo',
  category: 'Electronics'
});

// Sort results
utils.sortAds(ads, 'price-desc');

// Stats
const stats = utils.generateStats(ads);
// { total, with_price, min_price, max_price, avg_price, locations, categories }

// Export
utils.exportToJSON(ads, 'results.json');
await utils.exportToCSV(ads, 'results.csv');

// Display
utils.displayTable(ads, ['title', 'price', 'location']);
utils.formatPrice(rawPrice);  // 'Rs 1,000,000'
utils.parsePrice('Rs 1,000,000');  // 1000000

// Cache
const cache = new Cache({ cacheDir: './cache', cacheTTL: 3600 });
cache.get(keyword, options);
cache.set(keyword, data, options);
cache.clear();
cache.info();
```

---

## 📱 Examples

### Example 1: Search with filters and caching

```js
const { search } = require('ikman-api-client');

const ads = await search('phone', {
  maxPages: 5,
  minPrice: 50000,
  maxPrice: 150000,
  location: 'Colombo',
  sortBy: 'price-asc',
  cache: true,
  cacheTTL: 3600,
  verbose: true
});

console.log(`Found ${ads.length} phones`);
```

### Example 2: Stream large result sets

```js
const { searchPages } = require('ikman-api-client');

let totalCount = 0;

for await (const pageAds of searchPages('property', {
  maxPages: 100,
  minPrice: 1000000,
  category: 'Real Estate',
  sortBy: 'price-asc'
})) {
  totalCount += pageAds.length;
  // Process each page, discard before loading next
  pageAds.forEach(ad => console.log(ad.title));
}

console.log(`Total: ${totalCount}`);
```

### Example 3: Batch fetch ad details

```js
const { batch } = require('ikman-api-client');

const urls = [
  'https://ikman.lk/en/ad/111-item-1',
  'https://ikman.lk/en/ad/222-item-2'
];

const { results, errors, stats } = await batch(urls, {
  concurrency: 5,
  delay: 1000
});

console.log(`Success: ${results.length}, Errors: ${errors.length}`);
```

### Example 4: Export search results

```js
const { search, utils } = require('ikman-api-client');

const ads = await search('car', { maxPages: 10 });

// JSON export
utils.exportToJSON(ads, 'cars.json');

// CSV export
await utils.exportToCSV(ads, 'cars.csv');

// Statistics
const stats = utils.generateStats(ads);
console.log(stats);
```

### Example 5: CLI search

```bash
# Basic search
ikman search "pixel phone"

# With filters
ikman search "house" \
  --min-price 2000000 \
  --max-price 10000000 \
  --location Colombo \
  --sort price-asc

# Stream mode (memory efficient)
ikman search "car" --streaming --limit 50

# Save results
ikman search "laptop" \
  --output results.json \
  --max-pages 20
```

---

## 🧪 Local Development

```bash
npm install
npm test              # Run tests
npm run lint          # Check code style
npm run check         # Lint + test
npm run example       # Run search example
```

---

## 📝 Notes

- Respect ikman.lk [terms of service](https://ikman.lk/en/help/terms) and robots policies
- Use reasonable delays to avoid aggressive request patterns
- ikman.lk structure may change; keep package updated
- Price sorting is done client-side for reliability
- Caching is file-based and local only

---

## 📄 License

MIT — see [LICENSE](LICENSE)

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines

## 💬 Support & Questions

- **Issues**: https://github.com/GeekHirushaDev/ikman-API-Client/issues
- **Discussions**: https://github.com/GeekHirushaDev/ikman-API-Client/discussions
