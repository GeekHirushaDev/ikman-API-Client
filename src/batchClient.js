/**
 * Batch client for multiple ikman.lk ads
 */
const PQueue = require('p-queue').default;
const { logger, createProgressBar, exportToJSON } = require('./utils');
const { getAdDetails } = require('./adClient');
const { DEFAULTS } = require('./constants');
const { validateUrls } = require('./validators');

async function processAdsBatch(urls, options = {}) {
  const validatedUrls = validateUrls(urls);

  const config = {
    ...DEFAULTS.BATCH,
    ...options
  };

  const results = [];
  const errors = [];
  const startedAt = Date.now();

  logger.info(`🚀 Starting batch processing of ${validatedUrls.length} ads...`);
  logger.info(`⚡ Concurrency: ${config.concurrency}`);
  logger.info(`⏱️  Delay between requests: ${config.delay}ms`);

  const queue = new PQueue({ concurrency: config.concurrency });

  const progressBar = config.verbose ? createProgressBar(validatedUrls.length, 'detailed') : null;
  if (progressBar) {
    progressBar.start(validatedUrls.length, 0);
  }

  const promises = validatedUrls.map((url, index) => queue.add(async () => {
    try {
      if (index > 0 && config.delay > 0) {
        await new Promise((resolve) => {
          setTimeout(resolve, config.delay);
        });
      }

      const ad = await getAdDetails(url, {
        ...config,
        verbose: false
      });

      results.push({
        ...ad,
        request_index: index,
        request_timestamp: new Date().toISOString()
      });

      if (progressBar) {
        progressBar.increment();
      } else if (config.verbose) {
        logger.success(`[${index + 1}/${validatedUrls.length}] Success: ${ad.title.substring(0, 50)}...`);
      }
    } catch (error) {
      errors.push({
        url,
        index,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      if (progressBar) {
        progressBar.increment();
      } else if (config.verbose) {
        logger.error(`[${index + 1}/${validatedUrls.length}] Failed: ${error.message}`);
      }
    }
  }));

  await Promise.all(promises);

  if (progressBar) {
    progressBar.stop();
  }

  const elapsedMs = Date.now() - startedAt;
  const stats = {
    total: validatedUrls.length,
    successful: results.length,
    failed: errors.length,
    success_rate: `${((results.length / validatedUrls.length) * 100).toFixed(2)}%`,
    time_taken: `${(elapsedMs / 1000).toFixed(2)}s`,
    errors_by_type: {}
  };

  errors.forEach((entry) => {
    const errorType = entry.error.split('(')[0].trim();
    stats.errors_by_type[errorType] = (stats.errors_by_type[errorType] || 0) + 1;
  });

  console.log(`\n${'='.repeat(60)}`);
  logger.info('📊 BATCH PROCESSING SUMMARY');
  console.log('='.repeat(60));

  logger.success(`✅ Successful: ${results.length}/${validatedUrls.length}`);
  if (errors.length > 0) {
    logger.error(`❌ Failed: ${errors.length}/${validatedUrls.length}`);
  }
  logger.info(`📈 Success Rate: ${stats.success_rate}`);
  logger.info(`⏱️ Time Taken: ${stats.time_taken}`);

  if (Object.keys(stats.errors_by_type).length > 0) {
    logger.warn('\n📉 Error Breakdown:');
    Object.entries(stats.errors_by_type).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
  }

  console.log(`${'='.repeat(60)}\n`);

  if (config.saveToFile) {
    const output = {
      metadata: {
        timestamp: new Date().toISOString(),
        total_urls: validatedUrls.length,
        successful: results.length,
        failed: errors.length,
        config
      },
      results,
      errors: errors.length > 0 ? errors : undefined
    };

    exportToJSON(output, config.fileName);
  }

  return { results, errors, stats };
}

async function getImagesFromUrls(urls, options = {}) {
  const { results, errors, stats } = await processAdsBatch(urls, options);

  const imageResults = results.map((ad) => ({
    id: ad.id,
    url: ad.url,
    title: ad.title,
    image_count: ad.image_count || ad.images?.length || 0,
    main_image: ad.main_image || null,
    images: ad.images || []
  }));

  const allImages = [...new Set(imageResults.flatMap((item) => item.images))];

  return {
    results: imageResults,
    all_images: allImages,
    errors,
    stats
  };
}

module.exports = {
  processAdsBatch,
  getImagesFromUrls
};