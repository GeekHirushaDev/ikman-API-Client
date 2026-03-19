const { search, Cache } = require('../src');

async function run() {
  const keyword = process.argv[2] || 'pixel';
  const maxPages = Number(process.argv[3] || 5);
  const cache = new Cache();
  cache.clear();

  const startedAt = Date.now();
  const results = await search(keyword, {
    maxPages,
    cache: true,
    cacheTTL: 3600,
    verbose: false
  });

  const elapsedMs = Date.now() - startedAt;

  console.log('Benchmark: Cold Cache');
  console.log(`Keyword: ${keyword}`);
  console.log(`Pages: ${maxPages}`);
  console.log(`Results: ${results.length}`);
  console.log(`Elapsed: ${elapsedMs}ms`);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
