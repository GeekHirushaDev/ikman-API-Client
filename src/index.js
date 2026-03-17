/**
 * ikman-api-client - Complete API client for ikman.lk
 */

const { searchListings } = require('./searchClient');
const { getAdDetails } = require('./adClient');
const { processAdsBatch, getImagesFromUrls } = require('./batchClient');
const utils = require('./utils');
const constants = require('./constants');
const { version } = require('../package.json');

module.exports = {
  search: searchListings,
  searchListings,
  getAd: getAdDetails,
  getAdDetails,
  batch: processAdsBatch,
  processAdsBatch,
  getImagesFromUrls,

  utils: {
    sortAds: utils.sortAds,
    filterAds: utils.filterAds,
    exportToCSV: utils.exportToCSV,
    exportToJSON: utils.exportToJSON,
    generateStats: utils.generateStats,
    displayTable: utils.displayTable,
    formatPrice: utils.formatPrice,
    parsePrice: utils.parsePrice
  },

  constants: {
    SORT_OPTIONS: constants.SORT_OPTIONS,
    DEFAULTS: constants.DEFAULTS,
    ERRORS: constants.ERRORS
  },

  version
};