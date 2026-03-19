const { search } = require('../src');

async function run() {
  const keyword = process.argv[2] || 'pixel';
  const maxPages = Number(process.argv[3] || 5);

  const coldStart = Date.now();
  await search(keyword, {
    maxPages,
    cache: true,
    cacheTTL: 3600,
    verbose: false
  });
  const coldElapsed = Date.now() - coldStart;

  const warmStart = Date.now();
  const results = await search(keyword, {
    maxPages,
    cache: true,
    cacheTTL: 3600,
    verbose: false
  });
  const warmElapsed = Date.now() - warmStart;

  const speedup = warmElapsed > 0 ? (coldElapsed / warmElapsed).toFixed(2) : 'N/A';

  console.log('Benchmark: Warm Cache');
  console.log(`Keyword: ${keyword}`);
  console.log(`Pages: ${maxPages}`);
  console.log(`Results: ${results.length}`);
  console.log(`Cold Run: ${coldElapsed}ms`);
  console.log(`Warm Run: ${warmElapsed}ms`);
  console.log(`Speedup: ${speedup}x`);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
