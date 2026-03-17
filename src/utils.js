/**
 * Utility functions for ikman-api-client
 */
const fs = require('fs');
const chalk = require('chalk');
const cliProgress = require('cli-progress');
const Table = require('cli-table3');
const { createObjectCsvWriter } = require('csv-writer');

const logger = {
  info: (msg) => console.log(chalk.blue('ℹ'), chalk.white(msg)),
  success: (msg) => console.log(chalk.green('✓'), chalk.white(msg)),
  warn: (msg) => console.log(chalk.yellow('⚠'), chalk.white(msg)),
  error: (msg) => console.log(chalk.red('✗'), chalk.white(msg)),
  debug: (msg) => console.log(chalk.gray('🔍'), chalk.gray(msg)),
  data: (msg) => console.log(chalk.magenta('📊'), chalk.white(msg)),
  progress: (msg) => console.log(chalk.cyan('⏳'), chalk.white(msg))
};

function createProgressBar(total, format = 'progress') {
  const formats = {
    progress: '{bar} {percentage}% | {value}/{total}',
    detailed: '{bar} {percentage}% | {value}/{total} | {duration_formatted}'
  };

  return new cliProgress.SingleBar({
    format: formats[format] || formats.progress,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    clearOnComplete: false
  }, cliProgress.Presets.shades_classic);
}

function displayTable(ads, columns = ['title', 'price', 'location', 'postedTime']) {
  if (!ads || ads.length === 0) {
    logger.warn('No data to display');
    return;
  }

  const table = new Table({
    head: columns.map((col) => col.toUpperCase()),
    colWidths: columns.map((col) => {
      if (col === 'title') return 40;
      if (col === 'price') return 15;
      if (col === 'location') return 20;
      return 15;
    }),
    wordWrap: true,
    style: {
      head: ['cyan'],
      border: ['gray']
    }
  });

  ads.slice(0, 20).forEach((ad) => {
    const row = columns.map((col) => {
      const value = ad[col];
      if (col === 'price' && value) {
        return chalk.green(value);
      }
      return value || 'N/A';
    });
    table.push(row);
  });

  console.log(table.toString());

  if (ads.length > 20) {
    logger.info(`Showing first 20 of ${ads.length} results`);
  }
}

function formatPrice(price) {
  if (!price) return null;
  try {
    const numeric = price.toString().replace(/[^0-9.]/g, '');
    const num = parseFloat(numeric);
    if (Number.isNaN(num)) return price.toString();

    return `Rs ${num.toLocaleString('en-LK')}`;
  } catch {
    return price.toString();
  }
}

function parsePrice(price) {
  if (!price) return Infinity;
  if (typeof price === 'number') return price;

  const numeric = price.toString().replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(numeric);
  return Number.isNaN(parsed) ? Infinity : parsed;
}

function sortAds(ads, sortBy = 'price-asc') {
  const sortFunctions = {
    'price-asc': (a, b) => parsePrice(a.price) - parsePrice(b.price),
    'price-desc': (a, b) => parsePrice(b.price) - parsePrice(a.price),
    'date-asc': (a, b) => new Date(a.postedDate || a.postedTime) - new Date(b.postedDate || b.postedTime),
    'date-desc': (a, b) => new Date(b.postedDate || b.postedTime) - new Date(a.postedDate || a.postedTime),
    relevance: () => 0
  };

  const sortFn = sortFunctions[sortBy] || sortFunctions['price-asc'];
  return [...ads].sort(sortFn);
}

function filterAds(ads, filters = {}) {
  return ads.filter((ad) => {
    for (const [key, value] of Object.entries(filters)) {
      if (key === 'minPrice') {
        if (parsePrice(ad.price) < value) return false;
      } else if (key === 'maxPrice') {
        if (parsePrice(ad.price) > value) return false;
      } else if (key === 'location') {
        if (!ad.location?.toLowerCase().includes(value.toLowerCase())) return false;
      } else if (ad[key] !== value) {
        return false;
      }
    }
    return true;
  });
}

async function exportToCSV(ads, filename = 'ikman_export.csv') {
  if (!ads.length) {
    logger.warn('No data to export');
    return;
  }

  const headers = Object.keys(ads[0]).map((key) => ({
    id: key,
    title: key.replace(/_/g, ' ').toUpperCase()
  }));

  const csvWriter = createObjectCsvWriter({
    path: filename,
    header: headers
  });

  await csvWriter.writeRecords(ads);
  logger.success(`📊 Exported ${ads.length} ads to ${filename}`);
}

function exportToJSON(data, filename = 'ikman_export.json') {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  const count = Array.isArray(data) ? data.length : 1;
  logger.success(`📁 Exported ${count} record(s) to ${filename}`);
}

async function delay(min = 2000, max = 4000) {
  const time = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

function extractNumber(str) {
  if (!str) return null;
  const match = str.toString().match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

function parseLocation(locationStr) {
  if (!locationStr) return { full: null, city: null, district: null };

  const parts = locationStr.split(',').map((s) => s.trim()).filter(Boolean);

  return {
    full: parts.join(', '),
    city: parts[0] || null,
    district: parts[1] || parts[0] || null
  };
}

function generateStats(ads) {
  if (!ads.length) return { total: 0, with_price: 0, locations: {}, categories: {} };

  const prices = ads.map((ad) => parsePrice(ad.price)).filter((p) => p !== Infinity);

  const stats = {
    total: ads.length,
    with_price: prices.length,
    min_price: prices.length ? Math.min(...prices) : null,
    max_price: prices.length ? Math.max(...prices) : null,
    avg_price: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null,
    locations: {},
    categories: {}
  };

  ads.forEach((ad) => {
    if (ad.location) {
      stats.locations[ad.location] = (stats.locations[ad.location] || 0) + 1;
    }
    if (ad.category) {
      stats.categories[ad.category] = (stats.categories[ad.category] || 0) + 1;
    }
  });

  return stats;
}

function displayStats(stats) {
  console.log(`\n${chalk.cyan('═'.repeat(50))}`);
  console.log(chalk.white.bold('📊 API STATISTICS'));
  console.log(chalk.cyan('═'.repeat(50)));

  console.log(chalk.white(`Total Ads: ${chalk.yellow(stats.total ?? 0)}`));
  if (typeof stats.with_price === 'number') {
    console.log(chalk.white(`Ads with Price: ${chalk.yellow(stats.with_price)}`));
  }

  const pagesProcessed = stats.pages_processed;
  if (pagesProcessed !== undefined) {
    console.log(chalk.white(`Pages Processed: ${chalk.yellow(pagesProcessed)}`));
  }
  if (stats.keyword) {
    console.log(chalk.white(`Keyword: ${chalk.yellow(stats.keyword)}`));
  }
  if (stats.sort_by) {
    console.log(chalk.white(`Sort By: ${chalk.yellow(stats.sort_by)}`));
  }

  if (stats.min_price) {
    console.log(chalk.white(`Min Price: ${chalk.green(`Rs ${stats.min_price.toLocaleString()}`)}`));
  }
  if (stats.max_price) {
    console.log(chalk.white(`Max Price: ${chalk.green(`Rs ${stats.max_price.toLocaleString()}`)}`));
  }
  if (stats.avg_price) {
    console.log(chalk.white(`Avg Price: ${chalk.green(`Rs ${Math.round(stats.avg_price).toLocaleString()}`)}`));
  }

  if (stats.locations && Object.keys(stats.locations).length > 0) {
    console.log(chalk.cyan('\n📍 Top Locations:'));
    Object.entries(stats.locations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([loc, count]) => {
        console.log(chalk.white(`  ${loc}: ${chalk.yellow(count)} ads`));
      });
  }

  if (stats.categories && Object.keys(stats.categories).length > 0) {
    console.log(chalk.cyan('\n📁 Categories:'));
    Object.entries(stats.categories).forEach(([cat, count]) => {
      console.log(chalk.white(`  ${cat}: ${chalk.yellow(count)} ads`));
    });
  }

  console.log(`${chalk.cyan('═'.repeat(50))}\n`);
}

module.exports = {
  logger,
  createProgressBar,
  displayTable,
  formatPrice,
  parsePrice,
  sortAds,
  filterAds,
  exportToCSV,
  exportToJSON,
  delay,
  extractNumber,
  parseLocation,
  generateStats,
  displayStats
};