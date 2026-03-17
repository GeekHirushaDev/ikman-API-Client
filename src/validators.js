/**
 * Input validation for ikman-api-client
 */
const Joi = require('joi');

const schemas = {
  keyword: Joi.string().min(1).max(200).required(),

  url: Joi.string().uri().pattern(/ikman\.lk\/en\/ad\//).required(),

  urls: Joi.array().items(
    Joi.string().uri().pattern(/ikman\.lk\/en\/ad\//)
  ).min(1).max(100),

  sortOption: Joi.string().valid(
    'price-asc',
    'price-desc',
    'date-asc',
    'date-desc',
    'relevance'
  ),

  searchOptions: Joi.object({
    maxPages: Joi.number().integer().min(1).max(1000),
    respectAccessLimit: Joi.boolean(),
    headless: Joi.boolean(),
    timeout: Joi.number().integer().min(5000).max(300000),
    retries: Joi.number().integer().min(0).max(10),
    sortBy: Joi.string().valid(
      'price-asc',
      'price-desc',
      'date-asc',
      'date-desc',
      'relevance'
    ),
    saveToFile: Joi.boolean(),
    fileName: Joi.string().pattern(/\.json$/),
    verbose: Joi.boolean(),
    includeRaw: Joi.boolean(),
    delay: Joi.object({
      min: Joi.number().integer().min(500).max(10000),
      max: Joi.number().integer().min(500).max(10000)
    }).custom((value, helpers) => {
      if (value.min > value.max) {
        return helpers.error('delay.minMax');
      }
      return value;
    })
  }),

  adPageOptions: Joi.object({
    timeout: Joi.number().integer().min(5000).max(60000),
    verbose: Joi.boolean(),
    includeRaw: Joi.boolean(),
    retries: Joi.number().integer().min(0).max(10)
  }),

  batchOptions: Joi.object({
    concurrency: Joi.number().integer().min(1).max(20),
    delay: Joi.number().integer().min(0).max(10000),
    saveToFile: Joi.boolean(),
    fileName: Joi.string().pattern(/\.json$/),
    verbose: Joi.boolean()
  })
};

function validate(value, schemaName) {
  const schema = schemas[schemaName];
  if (!schema) {
    throw new Error(`Unknown validation schema: ${schemaName}`);
  }

  const { error, value: validatedValue } = schema.validate(value);

  if (error) {
    throw new Error(`Validation error: ${error.message}`);
  }

  return validatedValue;
}

function validateSearch(keyword, options = {}) {
  const validatedKeyword = validate(keyword, 'keyword');
  const validatedOptions = validate(options, 'searchOptions');

  return { keyword: validatedKeyword, options: validatedOptions };
}

function validateUrl(url) {
  return validate(url, 'url');
}

function validateUrls(urls) {
  return validate(urls, 'urls');
}

module.exports = {
  validate,
  validateSearch,
  validateUrl,
  validateUrls,
  schemas
};