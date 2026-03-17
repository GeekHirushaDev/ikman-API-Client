/**
 * Individual ad page client for ikman.lk
 */
const axios = require('axios');
const { JSDOM } = require('jsdom');
const { logger, formatPrice, parseLocation, extractNumber } = require('./utils');
const { DEFAULTS, USER_AGENTS, ERRORS, PROPERTY_MAPPING } = require('./constants');
const { validateUrl } = require('./validators');

function extractPropertyFields(ad) {
  const fields = {};
  const category = ad.category?.slug;

  if (!category || !PROPERTY_MAPPING[category]) {
    return fields;
  }

  PROPERTY_MAPPING[category].forEach((field) => {
    const prop = ad.properties?.find((p) => p.key === field);
    if (prop) {
      fields[field] = prop.value;
    }
  });

  return fields;
}

function extractAdFromHTML(html, url, includeRaw = false) {
  const dom = new JSDOM(html, { runScripts: 'dangerously' });
  const { window } = dom;

  if (!window.initialData || !window.initialData.adDetail || window.initialData.adDetail.type !== 'Success') {
    throw new Error('Could not extract ad data from page');
  }

  const adDetail = window.initialData.adDetail.data;
  const ad = adDetail.ad;

  if (!ad) {
    throw new Error('Ad not found in page data');
  }

  const propertyFields = extractPropertyFields(ad);

  const location = parseLocation(
    `${ad.location?.name || ''}, ${ad.area?.name || ''}`.trim()
  );

  return {
    id: ad.id,
    title: ad.title,
    description: ad.description || '',
    url: ad.url || url,
    slug: ad.slug,
    type: ad.type,

    price: formatPrice(ad.money?.amount),
    price_raw: ad.money?.amount,
    price_numeric: extractNumber(ad.money?.amount),
    negotiable: ad.money?.negotiable === 'Negotiable',

    location: location.full,
    city: location.city,
    district: location.district,
    location_id: ad.location?.id,
    district_id: ad.area?.id,

    category: ad.category?.name,
    category_slug: ad.category?.slug,
    category_id: ad.category?.id,
    parent_category: ad.category?.parent?.name,
    parent_category_id: ad.category?.parent?.id,

    posted_date: ad.timestamp,
    posted_at: ad.adDate,
    expires_at: ad.deactivates,
    posted_timestamp: ad.adDate ? new Date(ad.adDate).getTime() : null,

    views: ad.statistics?.views || 0,

    seller: {
      id: ad.account?.id,
      name: ad.contactCard?.name || ad.shop?.name,
      is_member: ad.isMember || false,
      is_verified: ad.isVerified || false,
      is_featured: ad.isFeaturedMember || false,
      membership_level: ad.membershipLevel,
      member_since: ad.memberSince,
      shop: ad.shop ? {
        id: ad.shop.id,
        name: ad.shop.name,
        slug: ad.shop.slug,
        logo: ad.shop.logo,
        email: ad.shop.email
      } : null
    },

    contact: {
      phone_numbers: ad.contactCard?.phoneNumbers?.map((p) => ({
        number: p.number,
        verified: p.verified
      })) || [],
      chat_enabled: ad.contactCard?.chatEnabled || false,
      email: ad.shop?.email
    },

    ...propertyFields,

    images: ad.images?.meta?.map((img) => img.src) || [],
    main_image: ad.imgUrl,
    image_count: ad.images?.meta?.length || 0,

    is_promoted: ad.isPromoted || false,
    is_doorstep_delivery: ad.isDoorstepDelivery || false,
    is_safe_buy: ad.isSafeBuyApplicable || false,

    similar_ads: (adDetail.similarAds || []).slice(0, 10).map((similar) => ({
      id: similar.id,
      title: similar.title,
      price: similar.price,
      price_numeric: extractNumber(similar.price),
      location: similar.location,
      url: `https://ikman.lk/en/ad/${similar.slug}`,
      image: similar.imgUrl,
      category: similar.category?.name,
      posted_time: similar.timeStamp
    })),

    ...(includeRaw ? { _raw: ad } : {})
  };
}

async function getAdDetails(url, options = {}) {
  const { default: pRetry } = await import('p-retry');
  const validatedUrl = validateUrl(url);

  const config = {
    ...DEFAULTS.AD_PAGE,
    ...options
  };

  if (config.verbose) {
    logger.progress(`Fetching ad page: ${url}`);
  }

  const fetchPage = async () => {
    try {
      const response = await axios.get(validatedUrl, {
        timeout: config.timeout,
        headers: {
          'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        },
        maxRedirects: 5,
        validateStatus: (status) => ((status >= 200 && status < 300) || status === 404 || status === 410)
      });

      if (response.status === 404) {
        throw new Error(ERRORS.AD_NOT_FOUND);
      }

      if (response.status === 410) {
        throw new Error(ERRORS.AD_EXPIRED);
      }

      if (response.status !== 200) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const ad = extractAdFromHTML(response.data, validatedUrl, config.includeRaw);

      if (config.verbose) {
        logger.success(`Successfully loaded ad: "${ad.title}"`);
        logger.info(`💰 Price: ${ad.price || 'Not specified'}`);
        logger.info(`📍 Location: ${ad.location}`);
        logger.info(`📞 Phone numbers: ${ad.contact.phone_numbers.length}`);
        logger.info(`📸 Images: ${ad.images.length}`);
      }

      return ad;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error(ERRORS.AD_NOT_FOUND);
        }
        if (error.response.status === 410) {
          throw new Error(ERRORS.AD_EXPIRED);
        }
        if (error.response.status === 429) {
          throw new Error(ERRORS.TOO_MANY_REQUESTS);
        }
        throw new Error(`HTTP error ${error.response.status}`);
      } else if (error.request) {
        throw new Error(ERRORS.NETWORK_ERROR);
      }

      throw error;
    }
  };

  try {
    const result = await pRetry(fetchPage, {
      retries: config.retries,
      onFailedAttempt: (error) => {
        if (config.verbose) {
          logger.warn(`Attempt ${error.attemptNumber} failed: ${error.message}. Retrying...`);
        }
      },
      factor: 2,
      minTimeout: 2000,
      maxTimeout: 10000
    });

    return result;
  } catch (error) {
    if (config.verbose) {
      logger.error(`Failed to load ad: ${error.message}`);
    }
    throw error;
  }
}

module.exports = {
  getAdDetails,
  extractAdFromHTML
};