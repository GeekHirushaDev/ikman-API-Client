/**
 * Example: Get all image URLs from multiple ad links
 */
const { getImagesFromUrls } = require('../src');

async function imagesExample() {
  const urls = [
    'https://ikman.lk/en/ad/kh720-furnished-two-storey-luxury-house-for-sale-in-ja-ela-lake-city-for-sale-gampaha',
    'https://ikman.lk/en/ad/kh721-furnished-two-storey-house-for-sale-in-lake-city-ja-ela-for-sale-gampaha'
  ];

  try {
    const { results, all_images, errors, stats } = await getImagesFromUrls(urls, {
      concurrency: 2,
      delay: 1000,
      verbose: true
    });

    console.log('\n=== IMAGE SUMMARY ===');
    console.log(`Processed: ${stats.total}`);
    console.log(`Success: ${stats.successful}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Unique image URLs: ${all_images.length}`);

    results.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.title}`);
      console.log(`   Link: ${item.url}`);
      console.log(`   Images: ${item.image_count}`);
      console.log(`   Main: ${item.main_image || 'N/A'}`);
    });

    if (errors.length > 0) {
      console.log('\n=== ERRORS ===');
      errors.forEach((entry) => {
        console.log(`❌ ${entry.url}: ${entry.error}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

imagesExample();