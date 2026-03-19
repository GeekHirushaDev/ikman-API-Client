/**
 * Built-in plugin helpers for search transformation
 */

const { normalizeText, parsePrice } = require('./utils');

function normalizeLocationPlugin() {
  return {
    name: 'normalize-location',
    transformAd(ad) {
      const normalizedLocation = normalizeText(ad.location)
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .join(', ');

      return {
        ...ad,
        location_normalized: normalizedLocation || ad.location
      };
    }
  };
}

function scoreByPricePlugin({ min = 0, max = 50000000 } = {}) {
  const span = Math.max(max - min, 1);

  return {
    name: 'score-by-price',
    transformAd(ad) {
      const price = parsePrice(ad.price);
      if (!Number.isFinite(price)) {
        return {
          ...ad,
          score: 0
        };
      }

      const boundedPrice = Math.min(Math.max(price, min), max);
      const normalized = (boundedPrice - min) / span;
      const score = Math.round((1 - normalized) * 100);

      return {
        ...ad,
        score
      };
    }
  };
}

module.exports = {
  normalizeLocationPlugin,
  scoreByPricePlugin
};
