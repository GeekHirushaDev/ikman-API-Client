# ikman-api-client

A clean and practical Node.js client for [ikman.lk](https://ikman.lk).

Use it to:
- Search listings with reliable sorting
- Read full details of a single ad
- Process many ad URLs in batch
- Extract images from multiple ads
- Export and analyze results

[![npm version](https://img.shields.io/npm/v/ikman-api-client.svg)](https://www.npmjs.com/package/ikman-api-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)

---

## 📚 Table of Contents

- [🚀 Why this package?](#-why-this-package)
- [📦 Installation](#-installation)
- [⚡ Quick Start](#-quick-start)
- [💸 Reliable Price Sorting (Important)](#-reliable-price-sorting-important)
- [🧩 API Overview](#-api-overview)
  - [search(keyword, options)](#searchkeyword-options)
  - [getSearchSummary(keyword, options)](#getsearchsummarykeyword-options)
  - [getAd(url, options)](#getadurl-options)
  - [batch(urls, options)](#batchurls-options)
  - [getImagesFromUrls(urls, options)](#getimagesfromurlsurls-options)
- [🛠️ Utilities](#-utilities)
- [📱 Example: Pixel price list (asc)](#-example-pixel-price-list-asc)
- [🧪 Local Development](#-local-development)
- [📝 Notes](#-notes)
- [📄 License](#-license)
- [🤝 Contributing](#-contributing)
- [💬 Support](#-support)

---

## 🚀 Why this package?

`ikman-api-client` is built to be simple for beginners and useful for production scripts.

- Beginner-friendly API (`search`, `getAd`, `batch`)
- Stable retries and timeout controls
- Built-in validation for safer input
- TypeScript definitions included
- Utility helpers for sorting, filtering, stats, and exports

---

## 📦 Installation

```bash
npm install ikman-api-client
```

---

## ⚡ Quick Start

### 1) Search listings

```js
const { search } = require('ikman-api-client');

async function run() {
  const ads = await search('Pixel 10 pro', {
    maxPages: 3,
    sortBy: 'price-asc',
    delay: { min: 1000, max: 2000 }
  });

  console.log(`Found ${ads.length} ads`);
  console.log('Cheapest:', ads[0]?.title, ads[0]?.price);
}

run().catch(console.error);
```

### 2) Get one ad with full details

```js
const { getAd } = require('ikman-api-client');

async function run() {
  const ad = await getAd('https://ikman.lk/en/ad/12345-example-title');
  console.log(ad.title);
  console.log(ad.price);
  console.log(ad.seller?.name);
  console.log(ad.images?.length);
}

run().catch(console.error);
```

### 3) Batch process many ads

```js
const { batch } = require('ikman-api-client');

async function run() {
  const urls = [
    'https://ikman.lk/en/ad/111-example-1',
    'https://ikman.lk/en/ad/222-example-2'
  ];

  const { results, errors, stats } = await batch(urls, {
    concurrency: 3,
    delay: 1000
  });

  console.log(stats);
  console.log('Success:', results.length);
  console.log('Errors:', errors.length);
}

run().catch(console.error);
```

---

## 💸 Reliable Price Sorting (Important)

ikman upstream sorting can sometimes be inconsistent.

This package now enforces client-side fallback sorting for:
- `sortBy: 'price-asc'`
- `sortBy: 'price-desc'`

So returned arrays are correctly ordered by price without needing manual `.sort(...)`.

---

## 🧩 API Overview

## `search(keyword, options)`

Search listings by keyword.

### Options

- `maxPages` (number, default: `100`, range: `1-1000`)
- `respectAccessLimit` (boolean, default: `true`)
- `sortBy` (`price-asc` | `price-desc` | `date-asc` | `date-desc` | `relevance`)
- `timeout` (number, default: `90000`)
- `delay` ({ `min`, `max` })
- `saveToFile` (boolean)
- `fileName` (string)
- `verbose` (boolean)
- `retries` (number)

### Returns

Array of search ads with fields such as:
- `id`, `title`, `price`, `price_numeric`
- `location`, `link`, `postedTime`
- `category`, `seller_type`, `is_urgent`, `is_featured`

---

## `getSearchSummary(keyword, options)`

Reads result counts fast before full fetching.

Returns:
- `total_count`
- `accessible_count`
- `is_capped`
- `max_accessible_pages`

---

## `getAd(url, options)`

Fetches full ad details:
- Core fields (`title`, `description`, `price`)
- Seller/contact data
- Image list
- Category-specific metadata when available

---

## `batch(urls, options)`

Processes many URLs with queue + retries.

Returns:
- `results` (successful ads)
- `errors` (failed URLs with error info)
- `stats` (total/success/fail/time)

---

## `getImagesFromUrls(urls, options)`

Extracts image data from multiple ads.

Returns:
- Per-ad images in `results`
- Deduplicated global list in `all_images`

---

## 🛠️ Utilities

```js
const { utils } = require('ikman-api-client');

// Sort results
utils.sortAds(ads, 'price-desc');

// Filter by range/location
utils.filterAds(ads, {
  minPrice: 500000,
  maxPrice: 5000000,
  location: 'Colombo'
});

// Get statistics
const stats = utils.generateStats(ads);

// Export
await utils.exportToCSV(ads, 'results.csv');
utils.exportToJSON(ads, 'results.json');
```

---

## 📱 Example: Pixel price list (asc)

```js
const { search } = require('ikman-api-client');

async function loadPixel10ProListings() {
  const results = await search('Pixel 10 pro', {
    sortBy: 'price-asc',
    maxPages: 10,
    delay: { min: 1000, max: 2000 }
  });

  console.log(`Found ${results.length} listings`);

  results.forEach((ad, index) => {
    console.log(`${index + 1}. ${ad.title}`);
    console.log(`   Price: Rs ${ad.price_numeric.toLocaleString()}`);
    console.log(`   Location: ${ad.location}`);
    console.log(`   Link: ${ad.link}`);
    console.log('---');
  });
}

loadPixel10ProListings().catch((error) => {
  console.error('Error:', error.message);
});
```

---

## 🧪 Local Development

```bash
npm install
npm run check
npm test
npm run lint
```

Run demos:

```bash
npm run example
npm run example:ad
npm run example:batch
npm run example:advanced
npm run example:images
```

---

## 📝 Notes

- Respect ikman.lk terms of service and robots policies
- Use delays to avoid aggressive request behavior
- Website structure may change over time; keep package updated

---

## 📄 License

MIT — see [LICENSE](LICENSE)

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## 💬 Support

- Issues: https://github.com/GeekHirushaDev/ikman-API-Client/issues
- Discussions: https://github.com/GeekHirushaDev/ikman-API-Client/discussions
