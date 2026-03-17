/**
 * Example: Load a single ad page
 */
const { getAd } = require('../src');

async function singleAdExample() {
  const url = 'https://ikman.lk/en/ad/kh720-furnished-two-storey-luxury-house-for-sale-in-ja-ela-lake-city-for-sale-gampaha';

  try {
    console.log('\n📄 SINGLE AD EXAMPLE');
    console.log('='.repeat(60));

    const ad = await getAd(url, {
      verbose: true,
      includeRaw: false
    });

    console.log('\n=== AD DETAILS ===');
    console.log(`Title: ${ad.title}`);
    console.log(`Price: ${ad.price}`);
    console.log(`Location: ${ad.location}`);
    console.log(`Posted: ${ad.posted_date}`);
    console.log(`Views: ${ad.views}`);
    console.log(`Category: ${ad.category}`);

    console.log('\n=== SELLER INFO ===');
    console.log(`Name: ${ad.seller.name}`);
    console.log(`Member: ${ad.seller.is_member ? 'Yes' : 'No'}`);
    console.log(`Verified: ${ad.seller.is_verified ? 'Yes' : 'No'}`);
    console.log(`Member Since: ${ad.seller.member_since}`);

    console.log('\n=== CONTACT ===');
    ad.contact.phone_numbers.forEach((p, i) => {
      console.log(`Phone ${i + 1}: ${p.number} (${p.verified ? 'verified' : 'unverified'})`);
    });
    console.log(`Chat Enabled: ${ad.contact.chat_enabled ? 'Yes' : 'No'}`);

    console.log('\n=== PROPERTY DETAILS ===');
    console.log(`Bedrooms: ${ad.bedrooms || 'N/A'}`);
    console.log(`Bathrooms: ${ad.bathrooms || 'N/A'}`);
    console.log(`House size: ${ad.house_size || 'N/A'}`);
    console.log(`Land size: ${ad.land_size || 'N/A'}`);
    console.log(`Address: ${ad.address || 'N/A'}`);

    console.log('\n=== MEDIA ===');
    console.log(`Main image: ${ad.main_image}`);
    console.log(`Total images: ${ad.image_count}`);

    console.log('\n=== SIMILAR ADS ===');
    ad.similar_ads.slice(0, 3).forEach((similar, i) => {
      console.log(`${i + 1}. ${similar.title.substring(0, 50)}...`);
      console.log(`   Price: ${similar.price}`);
      console.log(`   Location: ${similar.location}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

singleAdExample();