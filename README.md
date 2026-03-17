# ikman-api-client

> **Complete API client for [ikman.lk](https://ikman.lk)** — Search listings, fetch ad details, batch process multiple links, and extract data.

[![npm version](https://img.shields.io/npm/v/ikman-api-client.svg)](https://www.npmjs.com/package/ikman-api-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)

## Features

✨ **Search** — Find listings by keyword with sorting and pagination  
📄 **Ad Details** — Fetch complete ad info including images, seller, contact, properties  
📦 **Batch Processing** — Process 100+ links concurrently with queue control  
🖼️ **Images** — Extract images from multiple ads in one call  
📊 **Utilities** — Sort, filter, export (CSV/JSON), generate stats  
🔄 **Retry Logic** — Auto-retry with exponential backoff  
✅ **Built-in Validation** — Input validation using Joi schemas  
📘 **TypeScript Support** — Full type definitions included  

## Installation

```bash
npm install ikman-api-client
```

If you encounter Puppeteer download issues:
```bash
PUPPETEER_SKIP_DOWNLOAD=1 npm install
```

---

## Quick Start

### 1️⃣ Search for listings

```javascript
const { search } = require('ikman-api-client');

const results = await search('laptop', {
  maxPages: 2,           // Fetch 2 pages (default: 100)
  sortBy: 'price-asc',   // Sort by price ascending
  timeout: 30000         // 30 second timeout
});

console.log(results);
// [
//   { id, title, price, location, link, postedTime, category, ... },
//   { ... }
// ]
```

### 2️⃣ Get full details of a single ad

```javascript
const { getAd } = require('ikman-api-client');

const ad = await getAd('https://ikman.lk/en/ad/12345-product-title');

console.log(ad);
// {
//   id, title, description, price, location,
//   seller: { name, phone, isMember, ... },
//   contact: { phones: [...], email, ... },
//   images: ['https://...', 'https://...'],
//   similar_ads: [...],
//   ...
// }
```

### 3️⃣ Process multiple ads at once

```javascript
const { batch } = require('ikman-api-client');

const urls = [
  'https://ikman.lk/en/ad/123-ad-1',
  'https://ikman.lk/en/ad/456-ad-2',
  'https://ikman.lk/en/ad/789-ad-3'
];

const { results, errors, stats } = await batch(urls, {
  concurrency: 3,   // Process 3 ads in parallel
  delay: 1000,      // 1 second delay between requests
  timeout: 30000
});

console.log(`✅ Success: ${stats.successful} ads`);
console.log(`❌ Failed: ${stats.failed} ads`);
console.log(`⏱️ Time taken: ${stats.time_taken}ms`);
```

### 4️⃣ Get images from multiple ads

```javascript
const { getImagesFromUrls } = require('ikman-api-client');

const urls = [
  'https://ikman.lk/en/ad/123-house',
  'https://ikman.lk/en/ad/456-house'
];

const { results, all_images, errors, stats } = await getImagesFromUrls(urls, {
  concurrency: 3
});

console.log(all_images);        // All unique images across links
// ['https://...jpg', 'https://...jpg', ...]

console.log(results[0].images); // Images for first link
// ['https://...jpg', 'https://...jpg']
```

---

## 📚 API Reference

### `search(keyword, options)` → `Promise<SearchAd[]>`

Search for listings by keyword.

**Parameters:**
- `keyword` *(string, required)* — Search term (1-200 characters)
- `options` *(object, optional)*
  - `maxPages` (number) — Pages to fetch. Default: `100`. Range: 1-1000
  - `sortBy` (string) — Sort results. Options: `price-asc`, `price-desc`, `date-asc`, `date-desc`, `relevance`. Default: `price-asc`
  - `headless` (boolean) — Run browser in headless mode. Default: `true`
  - `timeout` (number) — Page load timeout in ms. Default: `90000`. Range: 5000-300000
  - `delay` (object) — Delay between requests
    - `min` (number) — Minimum delay ms. Default: `2000`
    - `max` (number) — Maximum delay ms. Default: `4000`

**Returns:**
```javascript
[
  {
    id: number,
    title: string,
    price: string,
    price_numeric: number,
    location: string,
    link: string,
    postedTime: string,
    category: string,
    seller_type: string,
    is_urgent: boolean,
    is_featured: boolean
  },
  // ... more ads
]
```

**Example:**
```javascript
const { search } = require('ikman-api-client');

const ads = await search('iPhone', {
  maxPages: 5,
  sortBy: 'date-desc',  // Newest first
  delay: { min: 1000, max: 2000 }
});

ads.forEach(ad => console.log(`${ad.title} — Rs ${ad.price}`));
```

---

### `getAd(url, options)` → `Promise<DetailedAd>`

Fetch complete details of a single ad including images, seller info, and contact.

**Parameters:**
- `url` *(string, required)* — Full ikman.lk ad URL
- `options` *(object, optional)*
  - `timeout` (number) — Request timeout in ms. Default: `30000`
  - `retries` (number) — Number of retry attempts. Default: `3`. Range: 0-10

**Returns:**
```javascript
{
  // Basic info
  id: number,
  title: string,
  description: string,
  slug: string,
  url: string,
  
  // Pricing
  price: string,           // e.g., "Rs 1,500,000"
  price_numeric: number,   // e.g., 1500000
  negotiable: boolean,
  
  // Location
  location: string,
  city: string,
  district: string,
  
  // Category
  category: string,
  category_slug: string,
  parent_category: string,
  
  // Dates
  posted_date: string,
  posted_at: string,
  expires_at: string,
  
  // Seller info
  seller: {
    id: number,
    name: string,
    shop_name: string,
    is_member: boolean,
    is_verified: boolean,
    // ... more fields
  },
  
  // Contact
  contact: {
    phone_numbers: [
      { number: string, verified: boolean }
    ],
    email: string,
    chat_enabled: boolean
  },
  
  // Media
  images: ['https://...', 'https://...'],
  main_image: string,
  image_count: number,
  
  // Related
  similar_ads: [
    { id, title, price, location, url, image, ... }
  ],
  
  // Category-specific (if applicable)
  bedrooms: number,      // For real estate
  bathrooms: number,
  house_size: number,
  make: string,          // For vehicles
  model: string,
  year: number,
  // ... etc
}
```

**Example:**
```javascript
const { getAd } = require('ikman-api-client');

const ad = await getAd('https://ikman.lk/en/ad/123456-luxury-house');

console.log(ad.title);
console.log(ad.seller.name);
console.log(ad.contact.phone_numbers[0].number);
console.log(ad.images.length + ' photos');
```

---

### `batch(urls, options)` → `Promise<BatchResult>`

Process multiple ad URLs concurrently with built-in queue and retry logic.

**Parameters:**
- `urls` *(string[], required)* — Array of ikman.lk ad URLs (1-100 items)
- `options` *(object, optional)*
  - `concurrency` (number) — Parallel requests. Default: `3`. Range: 1-20
  - `delay` (number) — Delay between requests in ms. Default: `1000`. Range: 0-10000
  - `timeout` (number) — Request timeout in ms. Default: `30000`
  - `retries` (number) — Retries per URL. Default: `3`

**Returns:**
```javascript
{
  results: [
    {
      request_index: number,      // Original position in urls array
      request_timestamp: string,
      ...DetailedAd              // All fields from getAd()
    }
  ],
  errors: [
    {
      url: string,
      error: Error,
      attempt: number
    }
  ],
  stats: {
    total: number,
    successful: number,
    failed: number,
    success_rate: number,        // e.g., 95.5
    time_taken: number,          // milliseconds
    errors_by_type: { [key]: number }
  }
}
```

**Example:**
```javascript
const { batch } = require('ikman-api-client');

const urls = [
  'https://ikman.lk/en/ad/123-item-1',
  'https://ikman.lk/en/ad/456-item-2',
  'https://ikman.lk/en/ad/789-item-3'
];

const { results, errors, stats } = await batch(urls, {
  concurrency: 5,
  delay: 500
});

console.log(`📊 Stats:`);
console.log(`  ✅ Success: ${stats.successful}/${stats.total}`);
console.log(`  ❌ Failed: ${stats.failed}/${stats.total}`);
console.log(`  ⏱️ Time: ${(stats.time_taken / 1000).toFixed(2)}s`);

results.forEach(ad => {
  console.log(`${ad.title} - Rs ${ad.price_numeric.toLocaleString()}`);
});

if (errors.length > 0) {
  console.log('\n⚠️ Errors:');
  errors.forEach(e => console.log(`  ${e.url}: ${e.error.message}`));
}
```

---

### `getImagesFromUrls(urls, options)` → `Promise<ImageBatchResult>`

Get image data from multiple ad links in one call. Returns deduplicated image list plus per-link arrays.

**Parameters:**
- `urls` *(string[], required)* — Array of ikman.lk ad URLs
- `options` *(object, optional)* — Same as `batch()` options

**Returns:**
```javascript
{
  results: [
    {
      id: number,
      url: string,
      title: string,
      image_count: number,
      main_image: string,
      images: ['https://...']
    }
  ],
  all_images: ['https://...', 'https://...'],  // Deduplicated across all ads
  errors: [...],
  stats: { ... }
}
```

**Example:**
```javascript
const { getImagesFromUrls } = require('ikman-api-client');

const houseUrls = [
  'https://ikman.lk/en/ad/111-house-1',
  'https://ikman.lk/en/ad/222-house-2',
  'https://ikman.lk/en/ad/333-house-3'
];

const { results, all_images } = await getImagesFromUrls(houseUrls);

console.log(`Total unique images: ${all_images.length}`);
results.forEach(item => {
  console.log(`${item.title}: ${item.image_count} photos`);
  console.log(`  Images: ${item.images.join(', ')}`);
});
```

---

### Utilities

```javascript
const { utils } = require('ikman-api-client');

// ✨ Sorting
utils.sortAds(ads, 'price-desc');

// 🔍 Filtering
utils.filterAds(ads, { 
  minPrice: 500000,
  maxPrice: 2000000,
  location: 'Colombo',
  category: 'vehicles'
});

// 📊 Statistics
const stats = utils.generateStats(ads);
console.log(`Average price: Rs ${stats.avg_price.toLocaleString()}`);

// 💾 Export to CSV
await utils.exportToCSV(ads, 'results.csv');

// 💾 Export to JSON
await utils.exportToJSON(ads, 'results.json');

// 📋 Display as table
utils.displayTable(ads, ['title', 'price', 'location', 'posted_date']);
```

---

## 🎯 Use Cases

| Use Case | Function | Example |
|----------|----------|---------|
| **Find products** — Search listings by keyword | `search()` | `search('iPhone 15')` |
| **Scrape one ad** — Get full details of a product | `getAd()` | `getAd('https://ikman.lk/en/ad/123')` |
| **Download multiple** — Process 10-1000 links | `batch()` | `batch([url1, url2, ...])` |
| **Extract photos** — Get images from multiple ads | `getImagesFromUrls()` | `getImagesFromUrls([url1, url2])` |
| **Analyze prices** — Sort, filter, calculate stats | `utils.*` | `utils.generateStats(ads)` |

---

## 🔧 Local Development Guide

### Install & Try Examples

```bash
# 1️⃣ Install dependencies
npm install

# If Puppeteer fails to download:
PUPPETEER_SKIP_DOWNLOAD=1 npm install

# 2️⃣ Run quality checks (tests + linting)
npm run check

# 3️⃣ Try individual examples
npm run example              # Search demo
npm run example:ad          # Single ad fetch
npm run example:batch       # Process multiple ads
npm run example:advanced    # Advanced filtering
npm run example:images      # Extract images

# 4️⃣ Run everything at once
npm run try:all
```

### Run Tests

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# With coverage report
npm run test:coverage

# Sequential test execution (for debugging)
npm test -- --runInBand
```

### Run Linter

```bash
# Check for code style issues
npm run lint

# Combined check: lint + test
npm run check
```

---

## ❓ Common Questions

### Q: What data can I extract?
**A:** Search results (title, price, location, category), full ad details (seller, contact, images, property specs), and batch processing stats.

### Q: How fast is batch processing?
**A:** With 3 concurrent requests and 1000ms delay between requests, ~20 ads/minute. Adjust `concurrency` and `delay` options for your needs.

### Q: Can I export results?
**A:** Yes! Use `utils.exportToCSV()` or `utils.exportToJSON()` to save results.

### Q: What if a request fails?
**A:** Built-in retry logic (3 attempts by default) with exponential backoff. Failed URLs are returned in `errors` array.

### Q: Is there a rate limit?
**A:** No hard limit, but respect ikman.lk's terms of service. Add delays between requests to be a good citizen.

### Q: Do I need a browser installed?
**A:** Puppeteer bundles Chromium. If download fails, use `PUPPETEER_SKIP_DOWNLOAD=1` and ensure system Chrome/Chromium is available.

---

## 📋 Examples

### Example: Search & Filter

```javascript
const { search, utils } = require('ikman-api-client');

// Search for houses
const houses = await search('house in colombo', { maxPages: 3 });

// Filter by price range
const affordable = utils.filterAds(houses, {
  minPrice: 1000000,
  maxPrice: 10000000
});

// Sort by newest
const sorted = utils.sortAds(affordable, 'date-desc');

// Show results
utils.displayTable(sorted, ['title', 'price', 'location', 'posted_date']);

// Save to file
await utils.exportToCSV(sorted, 'colombo-houses.csv');
```

### Example: Batch Process Ads

```javascript
const { batch, utils } = require('ikman-api-client');

const urls = [
  'https://ikman.lk/en/ad/123-house-1',
  'https://ikman.lk/en/ad/456-house-2',
  // ... add more URLs
];

const { results, stats, errors } = await batch(urls, {
  concurrency: 5,
  timeout: 30000
});

console.log(`Processed: ${stats.successful}/${stats.total} ads`);
console.log(`Time: ${(stats.time_taken / 1000).toFixed(1)}s`);
console.log(`Success rate: ${stats.success_rate}%`);

// Generate stats and save
const analysis = utils.generateStats(results);
console.log(`Avg price: Rs ${analysis.avg_price.toLocaleString()}`);

await utils.exportToJSON(results, 'ads-data.json');
```

### Example: Extract Images from Multiple Ads

```javascript
const { getImagesFromUrls } = require('ikman-api-client');

const propertyUrls = [
  'https://ikman.lk/en/ad/111-apartment-1',
  'https://ikman.lk/en/ad/222-apartment-2',
  'https://ikman.lk/en/ad/333-apartment-3'
];

const { results, all_images, stats } = await getImagesFromUrls(propertyUrls, {
  concurrency: 3
});

console.log(`Downloaded ${all_images.length} unique images from ${stats.total} properties`);

results.forEach(property => {
  console.log(`\n${property.title}`);
  console.log(`Images: ${property.images.join(' | ')}`);
});

// Save all images info
await utils.exportToJSON(results, 'property-images.json');
```

---

## ⚠️ Important Notes

🔒 **Respect Terms of Service**  
Use this library responsibly. Respect ikman.lk's [terms of service](https://ikman.lk) and `robots.txt`.

🚦 **Rate Limiting**  
Add delays between requests to avoid overloading servers. Default delays (2000-4000ms) are included.

✅ **Data Accuracy**  
Website structure may change. If you encounter errors, update to the latest version.

🐛 **Troubleshooting**  
- Puppeteer issues? Use `PUPPETEER_SKIP_DOWNLOAD=1` during install
- Test failures? Ensure Node.js v14+ is installed
- Connection errors? Check internet and try again with higher `timeout` values

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

Want to improve this library? Contributions are welcome!

See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Setup instructions
- Local testing workflow
- Pull request guidelines
- Code style requirements

---

## 📞 Support

- 🐛 **Bug Report** — [GitHub Issues](https://github.com/GeekHirushaDev/ikman-API-Client/issues)
- 📚 **Documentation** — [GitHub Wiki](https://github.com/GeekHirushaDev/ikman-API-Client)
- 💬 **Questions** — [GitHub Discussions](https://github.com/GeekHirushaDev/ikman-API-Client/discussions)

---

## 🎉 Changelog

### v2.0.0 (Current)
- ✨ Complete API rewrite with neutral naming (`searchListings`, `getAdDetails`, `processAdsBatch`)
- ✨ New `getImagesFromUrls()` function for batch image extraction
- ✨ Full TypeScript definitions
- ✨ Comprehensive error handling and retry logic
- ✨ Production-ready with full test coverage

---

**Made with ❤️ for the Sri Lankan developer community**
