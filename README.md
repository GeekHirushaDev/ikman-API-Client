# ikman-api-client

✨ A modern Node.js + TypeScript-friendly client for [ikman.lk](https://ikman.lk).

Built for both simple scripts and serious data workflows:
- Fast keyword search with reliable sorting
- Advanced filtering (price/location/category)
- Duplicate detection + canonicalization
- Plugin pipeline for custom transforms/ranking
- Streaming pagination for memory efficiency
- Analytics export (`csv`, `jsonl`, `parquet`)
- Smart local caching for repeated runs

[![npm version](https://img.shields.io/npm/v/ikman-api-client.svg)](https://www.npmjs.com/package/ikman-api-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6.svg)](src/types.d.ts)
[![Plugins](https://img.shields.io/badge/Plugins-Customizable-8A2BE2.svg)](#-plugin-examples)
[![Streaming](https://img.shields.io/badge/Streaming-searchPages-1E90FF.svg)](#searchpages)
[![Export](https://img.shields.io/badge/Export-CSV%20%7C%20JSONL%20%7C%20Parquet-FF8C00.svg)](#-cli-usage)
[![Cache](https://img.shields.io/badge/Cache-File--Based-20B2AA.svg)](#caching)

---

## 📚 Table of Contents

- [🚀 Why This Package](#-why-this-package)
- [📦 Installation](#-installation)
- [⚡ Quick Start](#-quick-start)
- [🧠 Core Concepts](#-core-concepts)
  - [Reliable Sorting](#reliable-sorting)
  - [Dedupe + Canonicalization](#dedupe--canonicalization)
  - [Plugin Pipeline](#plugin-pipeline)
  - [Caching](#caching)
- [🧩 TypeScript-First API](#-typescript-first-api)
  - [search / searchListings](#search--searchlistings)
  - [searchPages](#searchpages)
  - [getSearchSummary](#getsearchsummary)
  - [getAd / getAdDetails](#getad--getaddetails)
  - [batch / processAdsBatch](#batch--processadsbatch)
  - [getImagesFromUrls](#getimagesfromurls)
- [🔌 Plugin Examples](#-plugin-examples)
- [🛠️ Utilities](#️-utilities)
- [🖥️ CLI Usage](#️-cli-usage)
- [📈 Benchmarks](#-benchmarks)
- [📂 Local Examples](#-local-examples)
- [✅ Best Practices](#-best-practices)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🚀 Why This Package

`ikman-api-client` gives you a clean API over ikman search pages, with practical features that reduce manual work:

- No manual HTML parsing in your app
- Strong defaults with customizable options
- Works for quick scripts and analytics pipelines
- Typed API surface for safer developer experience
- CLI support for non-dev workflows

---

## 📦 Installation

```bash
npm install ikman-api-client
```

Install globally for CLI usage:

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

console.log(`Found: ${ads.length}`);
console.log('Top result:', ads[0]?.title, ads[0]?.price);
```

---

## 🧠 Core Concepts

### Reliable Sorting

`price-asc` and `price-desc` are reinforced client-side to keep ordering stable even if upstream sort is inconsistent.

### Dedupe + Canonicalization

Duplicates are detected from canonical fields:
- normalized title
- normalized location
- numeric price

Enabled by default with `dedupe: true`.

### Plugin Pipeline

Add custom ad transforms and result transforms via `plugins`.

### Caching

File-based cache improves repeated searches.
- `cache` (boolean)
- `cacheTTL` (seconds)
- `cacheDir` (directory)

---

## 🧩 TypeScript-First API

All types are provided in `src/types.d.ts`.

### search / searchListings

Returns all results in one array.

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

### searchPages

Streams one page at a time (memory efficient):

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

### getSearchSummary

Quick metadata for total and accessible result counts:

```ts
import { getSearchSummary } from 'ikman-api-client';

const summary = await getSearchSummary('scooter', {
  sortBy: 'relevance',
  maxPages: 1
});

console.log(summary.total_count, summary.max_accessible_pages);
```

### getAd / getAdDetails

Get full details for one listing:

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

### batch / processAdsBatch

Process multiple ad URLs with concurrency:

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

### getImagesFromUrls

Extract images from multiple URLs:

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

## 🔌 Plugin Examples

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

const prioritizeUrgentPlugin: SearchPlugin = {
  name: 'prioritize-urgent',
  transformResults(rows) {
    return rows.sort((a, b) => Number(b.is_urgent) - Number(a.is_urgent));
  }
};

const rows = await search('laptop', {
  plugins: [prioritizeUrgentPlugin]
});
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
console.log(cache.info());
```

---

## 🖥️ CLI Usage

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

### Cache commands

```bash
ikman cache info
ikman cache clear
ikman cache dir
```

---

## 📈 Benchmarks

```bash
npm run benchmark:cold
npm run benchmark:warm
npm run benchmark:stream
npm run benchmark
```

With optional args:

```bash
node benchmarks/cold-cache.js "pixel" 8
node benchmarks/warm-cache.js "car" 10
node benchmarks/search-vs-pages.js "apartment" 20
```

---

## 📂 Local Examples

```bash
npm run example
npm run example:ad
npm run example:batch
npm run example:advanced
npm run example:images
npm run example:plugins
```

---

## ✅ Best Practices

- Keep `delay.min` and `delay.max` at respectful values
- Use `searchPages()` for large-volume workflows
- Keep `cache` enabled for repeated queries
- Add custom plugins for project-specific ranking/normalization
- Verify target URLs before running batch modes

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License

MIT — see [LICENSE](LICENSE)
