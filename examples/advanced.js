/**
 * Advanced usage examples
 */
const { search, getAd, utils } = require('../src');

async function advancedExamples() {
  try {
    console.log('\n🔍 ADVANCED EXAMPLE 1: Custom search');
    console.log('='.repeat(60));

    const cars = await search('toyota prius', {
      maxPages: 5,
      sortBy: 'price-desc',
      delay: {
        min: 3000,
        max: 5000
      },
      verbose: true
    });

    console.log(`Found ${cars.length} Toyota Prius listings`);

    console.log('\n📊 ADVANCED EXAMPLE 2: Data analysis');
    console.log('='.repeat(60));

    const withPrice = cars.filter((c) => c.price_numeric > 0);
    const stats = {
      total: cars.length,
      with_price: withPrice.length,
      avg_price: withPrice.length ? withPrice.reduce((sum, c) => sum + c.price_numeric, 0) / withPrice.length : null,
      min_price: withPrice.length ? Math.min(...withPrice.map((c) => c.price_numeric)) : null,
      max_price: withPrice.length ? Math.max(...withPrice.map((c) => c.price_numeric)) : null,
      locations: [...new Set(cars.map((c) => c.location))].length
    };

    console.log(stats);

    console.log('\n📄 ADVANCED EXAMPLE 3: Top 3 most expensive cars details');
    console.log('='.repeat(60));

    const topCars = cars.slice(0, 3);
    const details = [];

    for (const car of topCars) {
      if (car.link) {
        try {
          const detail = await getAd(car.link, { verbose: false });
          details.push(detail);
          console.log(`\n✅ Fetched details for: ${car.title.substring(0, 50)}...`);
        } catch {
          console.log(`❌ Failed to fetch details for: ${car.title.substring(0, 50)}...`);
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    console.log('\n💾 ADVANCED EXAMPLE 4: Exporting data');
    console.log('='.repeat(60));

    await utils.exportToCSV(cars, 'prius-listings.csv');
    utils.exportToJSON(cars, 'prius-listings.json');
    console.log('Data exported to CSV and JSON formats');

    console.log('\n📋 ADVANCED EXAMPLE 5: Table view');
    console.log('='.repeat(60));

    utils.displayTable(cars.slice(0, 10), ['title', 'price', 'location', 'postedTime']);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

advancedExamples();