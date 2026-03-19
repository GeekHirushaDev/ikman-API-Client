const { search, searchPages } = require('../src');

async function run() {
  const keyword = process.argv[2] || 'pixel';
  const maxPages = Number(process.argv[3] || 5);

  const searchStart = Date.now();
  const fullResults = await search(keyword, {
    maxPages,
    cache: false,
    verbose: false
  });
  const searchElapsed = Date.now() - searchStart;

  const pagesStart = Date.now();
  let pagedCount = 0;
  for await (const page of searchPages(keyword, {
    maxPages,
    cache: false,
    verbose: false
  })) {
    pagedCount += page.length;
  }
  const pagesElapsed = Date.now() - pagesStart;

  console.log('Benchmark: search() vs searchPages()');
  console.log(`Keyword: ${keyword}`);
  console.log(`Pages: ${maxPages}`);
  console.log(`search() results: ${fullResults.length}`);
  console.log(`search() elapsed: ${searchElapsed}ms`);
  console.log(`searchPages() results: ${pagedCount}`);
  console.log(`searchPages() elapsed: ${pagesElapsed}ms`);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
