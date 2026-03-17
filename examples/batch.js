/**
 * Example: Batch process multiple ads
 */
const { batch, utils } = require('../src');

async function batchExample() {
  const urls = [
    'https://ikman.lk/en/ad/kh720-furnished-two-storey-luxury-house-for-sale-in-ja-ela-lake-city-for-sale-gampaha',
    'https://ikman.lk/en/ad/kh721-furnished-two-storey-house-for-sale-in-lake-city-ja-ela-for-sale-gampaha',
    'https://ikman.lk/en/ad/kh740-luxury-two-storey-house-for-sale-in-gampaha-for-sale-gampaha',
    'https://ikman.lk/en/ad/k674-single-storey-house-for-sale-in-ja-ela-for-sale-gampaha-3',
    'https://ikman.lk/en/ad/b113-single-storey-house-for-sale-in-ja-ela-for-sale-gampaha-56'
  ];

  try {
    console.log('\n📦 BATCH PROCESSING EXAMPLE');
    console.log('='.repeat(60));

    const { results, errors, stats } = await batch(urls, {
      concurrency: 3,
      delay: 1000,
      saveToFile: true,
      fileName: 'batch-results.json',
      verbose: true
    });

    console.log('\n=== SUMMARY ===');
    console.log(`Total: ${stats.total}`);
    console.log(`Successful: ${stats.successful}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Success Rate: ${stats.success_rate}`);

    if (results.length > 0) {
      console.log('\n=== SUCCESSFUL ADS ===');
      results.forEach((ad, i) => {
        console.log(`${i + 1}. ${ad.title.substring(0, 50)}...`);
        console.log(`   Price: ${ad.price}`);
        console.log(`   Location: ${ad.location}`);
        console.log(`   Phone: ${ad.contact.phone_numbers[0]?.number || 'N/A'}`);
      });
    }

    if (errors.length > 0) {
      console.log('\n=== ERRORS ===');
      errors.forEach((e) => {
        console.log(`❌ ${e.url}: ${e.error}`);
      });
    }

    if (results.length > 0) {
      await utils.exportToCSV(results, 'batch-results.csv');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

batchExample();