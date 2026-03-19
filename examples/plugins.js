/**
 * Example: Plugin pipeline (normalize + score + custom ranking)
 */
const { search, plugins, utils } = require('../src');

const prioritizeColomboPlugin = {
  name: 'prioritize-colombo',
  transformAd(ad) {
    const normalized = (ad.location_normalized || ad.location || '').toLowerCase();
    return {
      ...ad,
      location_boost: normalized.includes('colombo') ? 15 : 0,
      final_score: (ad.score || 0) + (normalized.includes('colombo') ? 15 : 0)
    };
  },
  transformResults(rows) {
    return [...rows].sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
  }
};

async function runPluginExample() {
  try {
    console.log('\n🔌 PLUGIN EXAMPLE: normalize + score + custom rank');
    console.log('='.repeat(70));

    const ads = await search('iphone', {
      maxPages: 3,
      sortBy: 'price-asc',
      dedupe: true,
      plugins: [
        plugins.normalizeLocationPlugin(),
        plugins.scoreByPricePlugin({ min: 0, max: 500000 }),
        prioritizeColomboPlugin
      ],
      verbose: true
    });

    console.log(`\n✅ Final results: ${ads.length}`);

    const preview = ads.slice(0, 10).map((ad, index) => ({
      rank: index + 1,
      title: ad.title,
      price: ad.price,
      location: ad.location,
      location_normalized: ad.location_normalized,
      score: ad.score,
      location_boost: ad.location_boost,
      final_score: ad.final_score
    }));

    console.log('\n📊 Top ranked ads (after plugin transforms):');
    utils.displayTable(preview, ['rank', 'title', 'price', 'location', 'final_score']);

    utils.exportToJSON(preview, 'plugin-ranked-ads.json');
    console.log('\n💾 Saved preview to plugin-ranked-ads.json');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

runPluginExample();
