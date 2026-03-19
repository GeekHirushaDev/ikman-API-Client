# ikman-api-client

A practical Node.js + TypeScript-ready client for [ikman.lk](https://ikman.lk).

- Search listings with filtering, dedupe, plugins, and reliable sorting
- Stream results page-by-page with `searchPages()`
- Export analytics files in `csv`, `jsonl`, and `parquet`
- Cache repeated searches for faster runs
- Fetch full ad details and process URL batches

[![npm version](https://img.shields.io/npm/v/ikman-api-client.svg)](https://www.npmjs.com/package/ikman-api-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)

---

## 📦 Installation

```bash
npm install ikman-api-client
```

For CLI usage:

```bash
npm install -g ikman-api-client
```

---

## ⚡ Quick Start

```ts
import { search } from 'ikman-api-client';

const ads = await search('pixel phone', {
  maxPages: 5,
  sortBy: 'price-asc',
  minPrice: 50000,
  maxPrice: 250000,
  location: 'Colombo',
  dedupe: true,
  cache: true,
  cacheTTL: 3600,
  verbose: true
});

console.log(ads.length);
console.log(ads[0]?.title, ads[0]?.price);
```

---

## 🧩 TypeScript-First API Docs

All methods are fully typed via `src/types.d.ts`.

### `search(keyword, options)` / `searchListings(keyword, options)`

Returns all matching ads in one array.

```ts
import { search, SearchOptions } from 'ikman-api-client';

const options: SearchOptions = {
  maxPages: 20,
  respectAccessLimit: true,
  timeout: 90000,
  retries: 3,
  sortBy: 'price-desc',
  minPrice: 100000,
  maxPrice: 2000000,
  location: 'Colombo',
  category: 'Cars',
  dedupe: true,
  plugins: [],
  cache: true,
  cacheDir: '.ikman-cache',
  cacheTTL: 3600,
  saveToFile: false,
  fileName: 'ikman_results.json',
  verbose: true,
  includeRaw: false,
  delay: { min: 1000, max: 2000 }
};

const rows = await search('hybrid car', options);
```

### `searchPages(keyword, options)`

Async generator that yields one page at a time.

```ts
import { searchPages } from 'ikman-api-client';

for await (const page of searchPages('apartment', {
  maxPages: 10,
  sortBy: 'price-asc',
  location: 'Kandy',
  dedupe: true,
  verbose: false
})) {
  console.log('Page size:', page.length);
}
```

### `getSearchSummary(keyword, options)`

Returns result counts and pagination metadata.

```ts
import { getSearchSummary } from 'ikman-api-client';

const summary = await getSearchSummary('scooter', {
  sortBy: 'relevance',
  maxPages: 1
});

console.log(summary.total_count, summary.max_accessible_pages);
```

### `getAd(url, options)` / `getAdDetails(url, options)`

Fetches complete details of one ad.

```ts
import { getAd } from 'ikman-api-client';

const ad = await getAd('https://ikman.lk/en/ad/example-slug', {
  timeout: 30000,
  retries: 3,
  verbose: true,
  includeRaw: false
});

console.log(ad.title, ad.price, ad.images.length);
```

### `batch(urls, options)` / `processAdsBatch(urls, options)`

Processes many ad URLs with concurrency control.

```ts
import { batch } from 'ikman-api-client';

const { results, errors, stats } = await batch([
  'https://ikman.lk/en/ad/example-1',
  'https://ikman.lk/en/ad/example-2'
], {
  concurrency: 3,
  delay: 1000,
  saveToFile: false,
  fileName: 'ikman_batch_results.json',
  verbose: true
});

console.log(stats, results.length, errors.length);
```

### `getImagesFromUrls(urls, options)`

Extracts images from many ad URLs.

```ts
import { getImagesFromUrls } from 'ikman-api-client';

const payload = await getImagesFromUrls([
  'https://ikman.lk/en/ad/example-1',
  'https://ikman.lk/en/ad/example-2'
], {
  concurrency: 2,
  delay: 500,
  verbose: true
});

console.log(payload.all_images.length);
```

---

## 🔌 Plugin System (Custom Filters/Transforms)

`search()` and `searchPages()` support `plugins` for ad-level and result-level transforms.

### Built-in plugins

```ts
import { search, plugins } from 'ikman-api-client';

const rows = await search('iphone', {
  maxPages: 5,
  plugins: [
    plugins.normalizeLocationPlugin(),
    plugins.scoreByPricePlugin({ min: 0, max: 500000 })
  ]
});
```

### Custom plugin

```ts
import { search, SearchPlugin } from 'ikman-api-client';

const tagUrgentPlugin: SearchPlugin = {
  name: 'tag-urgent',
  transformAd(ad) {
    return {
      ...ad,
      score_tag: ad.is_urgent ? 'priority' : 'normal'
    };
  },
  transformResults(ads) {
    return ads.sort((a, b) => Number(b.is_urgent) - Number(a.is_urgent));
  }
};

const rows = await search('laptop', {
  plugins: [tagUrgentPlugin]
});
```

---

## 🧹 Duplicate Detection + Canonicalization

Duplicate reposts are handled by canonical keys built from:
- normalized title
- normalized location
- numeric price

This runs by default (`dedupe: true`).

```ts
import { search } from 'ikman-api-client';

const rows = await search('phone', {
  dedupe: true // default true
});
```

You can disable it:

```ts
const rows = await search('phone', { dedupe: false });
```

---

## 🛠️ Utilities

```ts
import { utils, Cache } from 'ikman-api-client';

utils.sortAds(rows, 'price-asc');
utils.filterAds(rows, { minPrice: 100000, location: 'Colombo' });
utils.dedupeAds(rows);

await utils.exportToCSV(rows, 'rows.csv');
await utils.exportToJSONL(rows, 'rows.jsonl');
await utils.exportToParquet(rows, 'rows.parquet');
utils.exportToJSON(rows, 'rows.json');

const cache = new Cache({ cacheTTL: 3600 });
cache.info();
```

---

## 🖥️ CLI

### Search

```bash
ikman search "pixel 8" --max-pages 5 --sort price-asc
ikman search "house" --location Colombo --min-price 5000000 --max-price 20000000
ikman search "car" --streaming --limit 100
ikman search "laptop" --format csv -o laptops.csv
```

### Export for analytics

```bash
ikman export "car" --format csv --out cars.csv
ikman export "car" --format jsonl --out cars.jsonl
ikman export "car" --format parquet --out cars.parquet
```

### Cache

```bash
ikman cache info
ikman cache clear
ikman cache dir
```

---

## 📈 Benchmark Scripts

Run these to compare runtime characteristics:

```bash
npm run benchmark:cold      # cold cache search
npm run benchmark:warm      # cold vs warm cache speedup
npm run benchmark:stream    # search() vs searchPages()
npm run benchmark           # all benchmarks
```

Optional args:

```bash
node benchmarks/cold-cache.js "pixel" 8
node benchmarks/warm-cache.js "car" 10
node benchmarks/search-vs-pages.js "apartment" 20
```

---

## ✅ Notes

- Price sorting (`price-asc`, `price-desc`) is reinforced client-side for consistency
- `search()` returns full array (all fetched pages)
- `searchPages()` yields page-by-page for memory efficiency
- Respect ikman.lk terms and add delays for polite scraping

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License

MIT — see [LICENSE](LICENSE)
