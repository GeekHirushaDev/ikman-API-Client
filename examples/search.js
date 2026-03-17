/**
 * Example: Search for ads with different sorting methods
 */
const { search, utils } = require('../src');

async function searchExamples() {
  try {
    console.log('\n🔍 SEARCH EXAMPLE 1: Default sorting (price low to high)');
    console.log('='.repeat(60));

    const ads1 = await search('luxury house', {
      maxPages: 3,
      verbose: true,
      saveToFile: true,
      fileName: 'luxury-houses.json'
    });

    console.log(`\nFound ${ads1.length} ads`);
    console.log('Cheapest:', ads1[0]?.title, '-', ads1[0]?.price);
    console.log('Most expensive:', ads1[ads1.length - 1]?.title, '-', ads1[ads1.length - 1]?.price);

    console.log('\n🔍 SEARCH EXAMPLE 2: Price high to low');
    console.log('='.repeat(60));

    const ads2 = await search('luxury house', {
      maxPages: 3,
      sortBy: 'price-desc',
      verbose: false
    });

    console.log(`Found ${ads2.length} ads`);
    console.log('Most expensive:', ads2[0]?.title, '-', ads2[0]?.price);

    console.log('\n🔍 SEARCH EXAMPLE 3: Newest first');
    console.log('='.repeat(60));

    const ads3 = await search('luxury house', {
      maxPages: 3,
      sortBy: 'date-desc',
      verbose: false
    });

    console.log(`Found ${ads3.length} ads`);
    console.log('Latest:', ads3[0]?.title, '-', ads3[0]?.postedTime);

    console.log('\n🔍 SEARCH EXAMPLE 4: Filtered results');
    console.log('='.repeat(60));

    const filtered = utils.filterAds(ads1, {
      minPrice: 5000000,
      maxPrice: 20000000
    });

    console.log(`Ads between 5M and 20M: ${filtered.length}`);
    utils.displayTable(filtered.slice(0, 5));

    console.log('\n📊 SEARCH EXAMPLE 5: Statistics');
    console.log('='.repeat(60));

    const stats = utils.generateStats(ads1);
    console.log(stats);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

searchExamples();