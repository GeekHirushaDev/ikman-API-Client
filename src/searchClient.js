/**
 * Search client for ikman.lk using HTTP requests (axios + jsdom)
 */
const axios = require('axios');
const { JSDOM } = require('jsdom');
const {
  logger,
  formatPrice,
  sortAds,
  filterAds,
  delay,
  createProgressBar,
  displayStats,
  exportToJSON,
  generateStats
} = require('./utils');
const {
  DEFAULTS,
  SORT_OPTIONS,
  SORT_PARAMS,
  USER_AGENTS,
  ERRORS,
  SEARCH_URL,
  SEARCH_ACCESS_LIMIT
} = require('./constants');
const { validateSearch } = require('./validators');
const Cache = require('./cache');

function extractSearchSummaryFromHTML(html) {
  const dom = new JSDOM(html, { runScripts: 'dangerously' });
  const { window } = dom;

  if (!window.initialData) {
    throw new Error('Could not find window.initialData in search page');
  }

  const initialData = window.initialData;
  const pagination = initialData?.serp?.ads?.data?.paginationData || {};
  const postedAdCount = initialData?.serp?.ads?.data?.postedAdCount;
  const pageSize = pagination.pageSize || 25;
  const totalCount = Number(pagination.total ?? postedAdCount ?? 0);
  const accessibleCount = Math.min(totalCount, SEARCH_ACCESS_LIMIT);

  return {
    total_count: totalCount,
    accessible_count: accessibleCount,
    is_capped: totalCount > SEARCH_ACCESS_LIMIT,
    access_limit: SEARCH_ACCESS_LIMIT,
    page_size: pageSize,
    max_accessible_pages: Math.ceil(accessibleCount / pageSize)
  };
}

function extractPageData(html) {
  const dom = new JSDOM(html, { runScripts: 'dangerously' });
  const { window } = dom;

  if (!window.initialData) {
    return { ads: [], pagination: null };
  }

  const initialData = window.initialData;
  const ads = initialData?.serp?.ads?.data?.ads || [];
  const pagination = initialData?.serp?.ads?.data?.paginationData || null;

  return { ads, pagination };
}

async function fetchPageWithRetry(url, config, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(url, {
        timeout: config.timeout,
        headers: {
          'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      return response.data;
    } catch (err) {
      const status = err.response?.status;

      if (status === 404) {
        throw new Error(`Page not found (404): ${url}`);
      }

      if (status === 429) {
        if (attempt < maxRetries) {
          const waitTime = 2 ** (attempt + 1) * 2000;
          if (config.verbose) {
            logger.warn(`Rate limited (429). Waiting ${waitTime / 1000}s before retry ${attempt + 1}/${maxRetries}...`);
          }
          // eslint-disable-next-line no-await-in-loop
          await delay(waitTime, waitTime + 1000);
          lastError = err;
          // eslint-disable-next-line no-continue
          continue;
        }
        throw new Error('Rate limited (429). Max retries exceeded.');
      }

      if (status === 500) {
        if (attempt < maxRetries) {
          const waitTime = 2 ** attempt * 1000;
          if (config.verbose) {
            logger.warn(`Server error (500). Waiting ${waitTime / 1000}s before retry ${attempt + 1}/${maxRetries}...`);
          }
          // eslint-disable-next-line no-await-in-loop
          await delay(waitTime, waitTime + 500);
          lastError = err;
          // eslint-disable-next-line no-continue
          continue;
        }
        throw new Error(`Server error (500): ${url}`);
      }

      lastError = err;
      if (attempt < maxRetries) {
        const waitTime = 2 ** attempt * 1000;
        if (config.verbose) {
          logger.warn(`Request failed: ${err.message}. Retry ${attempt + 1}/${maxRetries} in ${waitTime / 1000}s...`);
        }
        // eslint-disable-next-line no-await-in-loop
        await delay(waitTime, waitTime + 500);
      }
    }
  }

  throw lastError;
}

async function getSearchSummary(keyword, options = {}) {
  const { keyword: validatedKeyword, options: validatedOptions } = validateSearch(keyword, options);

  const config = {
    ...DEFAULTS.SEARCH,
    ...validatedOptions,
    sortBy: validatedOptions.sortBy || DEFAULTS.SEARCH.sortBy
  };

  const sortParam = SORT_PARAMS[config.sortBy];
  const url = `${SEARCH_URL}?sort=${sortParam}&query=${encodeURIComponent(validatedKeyword)}&page=1`;
  const html = await fetchPageWithRetry(url, config);
  const summary = extractSearchSummaryFromHTML(html);

  return {
    keyword: validatedKeyword,
    sort_by: config.sortBy,
    ...summary
  };
}

async function searchListings(keyword, options = {}) {
  const { keyword: validatedKeyword, options: validatedOptions } = validateSearch(keyword, options);

  const config = {
    ...DEFAULTS.SEARCH,
    ...validatedOptions,
    respectAccessLimit: validatedOptions.respectAccessLimit !== false,
    sortBy: validatedOptions.sortBy || DEFAULTS.SEARCH.sortBy,
    retries: validatedOptions.retries ?? DEFAULTS.SEARCH.retries
  };

  // Initialize cache
  const cache = new Cache({
    cache: config.cache,
    cacheDir: config.cacheDir,
    cacheTTL: config.cacheTTL
  });

  // Check cache first (before filters)
  const cachedResult = cache.get(validatedKeyword, {
    sortBy: config.sortBy,
    minPrice: config.minPrice,
    maxPrice: config.maxPrice,
    location: config.location,
    category: config.category
  });

  if (cachedResult) {
    if (config.verbose) {
      logger.success('📦 Results loaded from cache');
    }
    return cachedResult;
  }

  logger.info(`🚀 Starting search for: "${validatedKeyword}"`);
  logger.info(`📊 Sort method: ${config.sortBy}`);

  if (!SORT_OPTIONS[config.sortBy.toUpperCase().replace('-', '_')]) {
    throw new Error(ERRORS.INVALID_SORT_OPTION);
  }

  let searchSummary = null;
  let maxPagesToProcess = config.maxPages;

  try {
    searchSummary = await getSearchSummary(validatedKeyword, config);

    if (config.respectAccessLimit) {
      maxPagesToProcess = Math.min(config.maxPages, searchSummary.max_accessible_pages || config.maxPages);
    }

    if (config.verbose) {
      logger.info(`📌 Total results: ${searchSummary.total_count}`);
      logger.info(`📌 Accessible results: ${searchSummary.accessible_count}`);
      if (searchSummary.is_capped) {
        logger.warn(`Result set is capped to latest ${SEARCH_ACCESS_LIMIT} by ikman visibility limits.`);
      }
    }

    if ((searchSummary.accessible_count || 0) === 0) {
      return [];
    }
  } catch (error) {
    if (config.verbose) {
      logger.warn(`Could not prefetch result count: ${error.message}. Continuing with direct paging.`);
    }
  }

  const allAds = [];
  let pagesProcessed = 0;
  const sortParam = SORT_PARAMS[config.sortBy];

  const progressBar = config.verbose ? createProgressBar(maxPagesToProcess) : null;
  if (progressBar) progressBar.start(maxPagesToProcess, 0);

  for (let i = 1; i <= maxPagesToProcess; i += 1) {
    const url = `${SEARCH_URL}?sort=${sortParam}&query=${encodeURIComponent(validatedKeyword)}&page=${i}`;

    if (config.verbose && !progressBar) {
      logger.progress(`Page ${i}/${maxPagesToProcess}: Fetching...`);
    }

    try {
      const html = await fetchPageWithRetry(url, config, config.retries);
      const { ads: pageData } = extractPageData(html);

      if (!pageData || pageData.length === 0) {
        if (config.verbose && !progressBar) {
          logger.warn(`No more ads found at page ${i}. Stopping.`);
        }
        break;
      }

      const pageAds = pageData.map((ad) => ({
        id: ad.id || null,
        title: ad.title || 'No title',
        price: formatPrice(ad.price),
        price_raw: ad.price,
        price_numeric: parseFloat(ad.price?.toString().replace(/[^0-9.]/g, '') || '0'),
        location: ad.location || 'Unknown',
        area: ad.area || null,
        district: ad.district || null,
        link: ad.slug ? `https://ikman.lk/en/ad/${ad.slug}` : null,
        postedTime: ad.timeStamp || null,
        postedDate: ad.createdDate || null,
        category: ad.category || null,
        category_id: ad.categoryId || null,
        seller_type: ad.sellerType || null,
        ad_type: ad.type || null,
        is_urgent: ad.isUrgent || false,
        is_featured: ad.isFeatured || false,
        has_images: Boolean(ad.images?.length)
      }));

      allAds.push(...pageAds);
      pagesProcessed = i;

      if (progressBar) {
        progressBar.update(i);
      } else if (config.verbose) {
        logger.success(`Loaded ${pageAds.length} items (Total: ${allAds.length})`);
      }

      if (i < maxPagesToProcess) {
        // eslint-disable-next-line no-await-in-loop
        await delay(config.delay.min, config.delay.max);
      }
    } catch (err) {
      if (config.verbose) {
        logger.error(`Error on page ${i}: ${err.message}`);
      }
      if (!err.message.toLowerCase().includes('timeout')) break;
    }
  }

  if (progressBar) {
    progressBar.stop();
  }

  // Apply sorting (client-side fallback for price sorts)
  const sortedAds = ['price-asc', 'price-desc'].includes(config.sortBy)
    ? sortAds(allAds, config.sortBy)
    : allAds;

  // Apply filters (minPrice, maxPrice, location, category)
  let filteredAds = sortedAds;
  if (config.minPrice !== undefined || config.maxPrice !== undefined
      || config.location || config.category) {
    const filterObj = {};
    if (config.minPrice !== undefined) filterObj.minPrice = config.minPrice;
    if (config.maxPrice !== undefined) filterObj.maxPrice = config.maxPrice;
    if (config.location) filterObj.location = config.location;
    if (config.category) filterObj.category = config.category;

    filteredAds = filterAds(sortedAds, filterObj);

    if (config.verbose) {
      const originalCount = sortedAds.length;
      logger.info(`🔍 Filters applied: ${originalCount} → ${filteredAds.length} results`);
    }
  }

  const stats = {
    ...generateStats(filteredAds),
    pages_processed: pagesProcessed,
    total_count: searchSummary?.total_count,
    accessible_count: searchSummary?.accessible_count,
    access_limit: SEARCH_ACCESS_LIMIT,
    keyword: validatedKeyword,
    sort_by: config.sortBy,
    filters: {
      minPrice: config.minPrice,
      maxPrice: config.maxPrice,
      location: config.location,
      category: config.category
    }
  };

  if (config.verbose) {
    displayStats(stats);
    logger.success(`✅ Request complete! Found ${filteredAds.length} ads for "${validatedKeyword}"`);
  }

  if (config.saveToFile) {
    exportToJSON(filteredAds, config.fileName);
  }

  // Store in cache before returning
  cache.set(validatedKeyword, filteredAds, {
    sortBy: config.sortBy,
    minPrice: config.minPrice,
    maxPrice: config.maxPrice,
    location: config.location,
    category: config.category
  });

  return filteredAds;
}


/**
 * Generator function for streaming pagination
 * Yields results page-by-page without loading all in memory
 *
 * @example
 * for await (const pageResults of searchPages('pixel', { maxPages: 5 })) {
 *   console.log(`Page loaded: ${pageResults.length} ads`);
 *   pageResults.forEach(ad => console.log(ad.title));
 * }
 */
async function* searchPages(keyword, options = {}) {
  const { keyword: validatedKeyword, options: validatedOptions } = validateSearch(keyword, options);

  const config = {
    ...DEFAULTS.SEARCH,
    ...validatedOptions,
    respectAccessLimit: validatedOptions.respectAccessLimit !== false,
    sortBy: validatedOptions.sortBy || DEFAULTS.SEARCH.sortBy,
    retries: validatedOptions.retries ?? DEFAULTS.SEARCH.retries
  };

  if (!SORT_OPTIONS[config.sortBy.toUpperCase().replace('-', '_')]) {
    throw new Error(ERRORS.INVALID_SORT_OPTION);
  }

  let searchSummary = null;
  let maxPagesToProcess = config.maxPages;

  try {
    searchSummary = await getSearchSummary(validatedKeyword, config);

    if (config.respectAccessLimit) {
      maxPagesToProcess = Math.min(config.maxPages, searchSummary.max_accessible_pages || config.maxPages);
    }

    if (config.verbose) {
      logger.info(`🚀 Starting paginated search for: "${validatedKeyword}"`);
      logger.info(`📌 Total results: ${searchSummary.total_count}`);
      logger.info(`📌 Accessible results: ${searchSummary.accessible_count}`);
    }

    if ((searchSummary.accessible_count || 0) === 0) {
      return;
    }
  } catch (error) {
    if (config.verbose) {
      logger.warn(`Could not prefetch result count: ${error.message}. Continuing with direct paging.`);
    }
  }

  const sortParam = SORT_PARAMS[config.sortBy];
  let pagesProcessed = 0;

  for (let i = 1; i <= maxPagesToProcess; i += 1) {
    const url = `${SEARCH_URL}?sort=${sortParam}&query=${encodeURIComponent(validatedKeyword)}&page=${i}`;

    if (config.verbose) {
      logger.progress(`Page ${i}: Fetching...`);
    }

    try {
      const html = await fetchPageWithRetry(url, config, config.retries);
      const { ads: pageData } = extractPageData(html);

      if (!pageData || pageData.length === 0) {
        if (config.verbose) {
          logger.warn(`No more ads found at page ${i}. Stopping.`);
        }
        break;
      }

      const pageAds = pageData.map((ad) => ({
        id: ad.id || null,
        title: ad.title || 'No title',
        price: formatPrice(ad.price),
        price_raw: ad.price,
        price_numeric: parseFloat(ad.price?.toString().replace(/[^0-9.]/g, '') || '0'),
        location: ad.location || 'Unknown',
        area: ad.area || null,
        district: ad.district || null,
        link: ad.slug ? `https://ikman.lk/en/ad/${ad.slug}` : null,
        postedTime: ad.timeStamp || null,
        postedDate: ad.createdDate || null,
        category: ad.category || null,
        category_id: ad.categoryId || null,
        seller_type: ad.sellerType || null,
        ad_type: ad.type || null,
        is_urgent: ad.isUrgent || false,
        is_featured: ad.isFeatured || false,
        has_images: Boolean(ad.images?.length)
      }));

      pagesProcessed = i;

      // Apply sorting and filtering to page results
      let pageResults = ['price-asc', 'price-desc'].includes(config.sortBy)
        ? sortAds(pageAds, config.sortBy)
        : pageAds;

      if (config.minPrice !== undefined || config.maxPrice !== undefined
          || config.location || config.category) {
        const filterObj = {};
        if (config.minPrice !== undefined) filterObj.minPrice = config.minPrice;
        if (config.maxPrice !== undefined) filterObj.maxPrice = config.maxPrice;
        if (config.location) filterObj.location = config.location;
        if (config.category) filterObj.category = config.category;

        pageResults = filterAds(pageResults, filterObj);
      }

      if (config.verbose) {
        logger.success(`✓ Page ${i}: yielded ${pageResults.length} results`);
      }

      yield pageResults;

      if (i < maxPagesToProcess) {
        // eslint-disable-next-line no-await-in-loop
        await delay(config.delay.min, config.delay.max);
      }
    } catch (err) {
      if (config.verbose) {
        logger.error(`Error on page ${i}: ${err.message}`);
      }
      if (!err.message.toLowerCase().includes('timeout')) break;
    }
  }

  if (config.verbose) {
    logger.success(`✅ Pagination complete! Processed ${pagesProcessed} pages`);
  }
}

module.exports = {
  searchListings,
  getSearchSummary,
  extractSearchSummaryFromHTML,
  searchPages
};