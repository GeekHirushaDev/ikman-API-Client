/**
 * Constants and configurations for ikman-api-client
 */

module.exports = {
  BASE_URL: 'https://ikman.lk',
  SEARCH_URL: 'https://ikman.lk/en/ads/sri-lanka',
  SEARCH_ACCESS_LIMIT: 400,

  SORT_OPTIONS: {
    PRICE_ASC: 'price-asc',
    PRICE_DESC: 'price-desc',
    DATE_ASC: 'date-asc',
    DATE_DESC: 'date-desc',
    RELEVANCE: 'relevance'
  },

  SORT_PARAMS: {
    'price-asc': 'price_asc',
    'price-desc': 'price_desc',
    'date-asc': 'date_asc',
    'date-desc': 'date_desc',
    relevance: 'relevance'
  },

  USER_AGENTS: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; rv:122.0) Gecko/20100101 Firefox/122.0'
  ],

  DEFAULTS: {
    SEARCH: {
      maxPages: 100,
      headless: true,
      timeout: 90000,
      sortBy: 'price-asc',
      saveToFile: false,
      fileName: 'ikman_results.json',
      verbose: true,
      includeRaw: false,
      retries: 3,
      delay: {
        min: 1000,
        max: 2000
      }
    },
    AD_PAGE: {
      timeout: 30000,
      verbose: true,
      includeRaw: false,
      retries: 3
    },
    BATCH: {
      concurrency: 3,
      delay: 1000,
      saveToFile: false,
      fileName: 'ikman_batch_results.json',
      verbose: true
    }
  },

  ERRORS: {
    INVALID_URL: 'Invalid ikman.lk URL provided',
    AD_NOT_FOUND: 'Ad not found (404)',
    AD_EXPIRED: 'Ad has expired or been removed (410)',
    NETWORK_ERROR: 'Network error - could not fetch the page',
    CAPTCHA_DETECTED: 'Captcha detected - try again later or reduce request speed',
    NO_RESULTS: 'No ads found matching the criteria',
    TOO_MANY_REQUESTS: 'Too many requests (429) - try reducing request speed',
    INVALID_SORT_OPTION: 'Invalid sort option. Use: price-asc, price-desc, date-asc, date-desc, relevance'
  },

  HTTP_STATUS: {
    OK: 200,
    NOT_FOUND: 404,
    GONE: 410,
    TOO_MANY_REQUESTS: 429,
    SERVER_ERROR: 500
  },

  PROPERTY_MAPPING: {
    'houses-for-sale': ['bedrooms', 'bathrooms', 'house_size', 'land_size', 'address'],
    'apartments-for-sale': ['bedrooms', 'bathrooms', 'floor', 'furnished', 'address'],
    'land-for-sale': ['land_size', 'address', 'is_cleared'],
    cars: ['make', 'model', 'year', 'mileage', 'fuel_type', 'transmission'],
    motorbikes: ['make', 'model', 'year', 'engine_capacity'],
    'mobile-phones': ['brand', 'model', 'storage', 'ram', 'condition']
  }
};