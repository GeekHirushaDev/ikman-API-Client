/**
 * Search client for ikman.lk using Puppeteer
 */
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const {
  logger,
  formatPrice,
  delay,
  createProgressBar,
  displayStats,
  exportToJSON,
  generateStats
} = require('./utils');
const { DEFAULTS, SORT_OPTIONS, SORT_PARAMS, USER_AGENTS, ERRORS, SEARCH_URL } = require('./constants');
const { validateSearch } = require('./validators');

puppeteer.use(StealthPlugin());

async function searchListings(keyword, options = {}) {
  const { keyword: validatedKeyword, options: validatedOptions } = validateSearch(keyword, options);

  const config = {
    ...DEFAULTS.SEARCH,
    ...validatedOptions,
    sortBy: validatedOptions.sortBy || DEFAULTS.SEARCH.sortBy
  };

  logger.info(`🚀 Starting search for: "${validatedKeyword}"`);
  logger.info(`📊 Sort method: ${config.sortBy}`);

  if (!SORT_OPTIONS[config.sortBy.toUpperCase().replace('-', '_')]) {
    throw new Error(ERRORS.INVALID_SORT_OPTION);
  }

  const browser = await puppeteer.launch({
    headless: config.headless ? 'new' : false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1280,800'
    ]
  });

  const page = await browser.newPage();
  const allAds = [];
  let pagesProcessed = 0;

  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  await page.setUserAgent(userAgent);
  await page.setViewport({ width: 1280, height: 800 });

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  });

  const progressBar = config.verbose ? createProgressBar(config.maxPages) : null;
  if (progressBar) progressBar.start(config.maxPages, 0);

  for (let i = 1; i <= config.maxPages; i += 1) {
    const sortParam = SORT_PARAMS[config.sortBy];
    const url = `${SEARCH_URL}?page=${i}&query=${encodeURIComponent(validatedKeyword)}&sort=${sortParam}`;

    if (config.verbose && !progressBar) {
      logger.progress(`Page ${i}/${config.maxPages}: Fetching...`);
    }

    try {
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: config.timeout
      });

      const pageTitle = await page.title();
      if (pageTitle.toLowerCase().includes('captcha') || pageTitle.toLowerCase().includes('blocked')) {
        throw new Error(ERRORS.CAPTCHA_DETECTED);
      }

      const pageData = await page.evaluate(() => {
        if (globalThis.initialData?.serp?.ads?.data?.ads) {
          return globalThis.initialData.serp.ads.data.ads;
        }
        return null;
      });

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

      await delay(config.delay.min, config.delay.max);
    } catch (err) {
      if (config.verbose) {
        logger.error(`Error on page ${i}: ${err.message}`);
      }
      if (!err.message.toLowerCase().includes('timeout')) break;
    }
  }

  await browser.close();

  if (progressBar) {
    progressBar.stop();
  }

  const stats = {
    ...generateStats(allAds),
    pages_processed: pagesProcessed,
    keyword: validatedKeyword,
    sort_by: config.sortBy
  };

  if (config.verbose) {
    displayStats(stats);
    logger.success(`✅ Request complete! Found ${allAds.length} ads for "${validatedKeyword}"`);
  }

  if (config.saveToFile) {
    exportToJSON(allAds, config.fileName);
  }

  return allAds;
}

module.exports = {
  searchListings
};