/**
 * File-based caching layer for ikman-api-client
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { logger } = require('./utils');

class Cache {
  constructor(options = {}) {
    this.cacheDir = options.cacheDir || path.join(process.cwd(), '.ikman-cache');
    this.ttl = (options.cacheTTL || 3600) * 1000; // Convert seconds to milliseconds
    this.enabled = options.cache !== false;

    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Generate cache key from keyword and options
   */
  generateKey(keyword, options = {}) {
    const cacheableOptions = {
      sortBy: options.sortBy,
      minPrice: options.minPrice,
      maxPrice: options.maxPrice,
      location: options.location,
      category: options.category,
      dedupe: options.dedupe
    };

    const cacheStr = `${keyword}:${JSON.stringify(cacheableOptions)}`;
    return crypto.createHash('md5').update(cacheStr).digest('hex');
  }

  /**
   * Get cached data if valid
   */
  get(keyword, options = {}) {
    if (!this.enabled) return null;

    try {
      const key = this.generateKey(keyword, options);
      const filePath = path.join(this.cacheDir, `${key}.json`);

      if (!fs.existsSync(filePath)) {
        return null;
      }

      const fileStats = fs.statSync(filePath);
      const age = Date.now() - fileStats.mtimeMs;

      if (age > this.ttl) {
        // Cache expired, delete it
        fs.unlinkSync(filePath);
        return null;
      }

      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      logger.debug(`Cache retrieval error: ${err.message}`);
      return null;
    }
  }

  /**
   * Store data in cache
   */
  set(keyword, data, options = {}) {
    if (!this.enabled) return;

    try {
      const key = this.generateKey(keyword, options);
      const filePath = path.join(this.cacheDir, `${key}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      logger.debug(`Cache write error: ${err.message}`);
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    try {
      if (fs.existsSync(this.cacheDir)) {
        const files = fs.readdirSync(this.cacheDir);
        files.forEach((file) => {
          fs.unlinkSync(path.join(this.cacheDir, file));
        });
      }
      logger.success('Cache cleared');
    } catch (err) {
      logger.error(`Cache clear error: ${err.message}`);
    }
  }

  /**
   * Get cache info
   */
  info() {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        return { size: 0, files: 0, dir: this.cacheDir };
      }

      const files = fs.readdirSync(this.cacheDir);
      let totalSize = 0;

      files.forEach((file) => {
        const filePath = path.join(this.cacheDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });

      return {
        size: totalSize,
        files: files.length,
        dir: this.cacheDir,
        sizeGB: (totalSize / (1024 ** 3)).toFixed(2)
      };
    } catch (err) {
      return { error: err.message };
    }
  }
}

module.exports = Cache;
