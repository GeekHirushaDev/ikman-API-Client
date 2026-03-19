const axios = require('axios');
const { searchListings } = require('../src/searchClient');

jest.mock('axios');

function buildSearchHtml({ total = 2, pageSize = 25, ads = [] } = {}) {
  return `
    <html>
      <body>
        <script>
          window.initialData = {
            serp: {
              ads: {
                data: {
                  paginationData: { total: ${total}, pageSize: ${pageSize} },
                  postedAdCount: ${total},
                  ads: ${JSON.stringify(ads)}
                }
              }
            }
          };
        </script>
      </body>
    </html>
  `;
}

describe('searchListings client-side price sorting', () => {
  beforeEach(() => {
    axios.get.mockReset();
  });

  test('returns price-asc results sorted low to high', async () => {
    const ads = [
      { id: '1', title: 'Expensive', price: 'Rs 900,000', location: 'Colombo', slug: 'expensive-ad' },
      { id: '2', title: 'Cheap', price: 'Rs 100,000', location: 'Kandy', slug: 'cheap-ad' },
      { id: '3', title: 'Mid', price: 'Rs 450,000', location: 'Galle', slug: 'mid-ad' }
    ];

    axios.get
      .mockResolvedValueOnce({ data: buildSearchHtml({ total: 3 }) })
      .mockResolvedValueOnce({ data: buildSearchHtml({ total: 3, ads }) });

    const results = await searchListings('pixel 10 pro', {
      sortBy: 'price-asc',
      maxPages: 1,
      verbose: false
    });

    expect(results.map((ad) => ad.title)).toEqual(['Cheap', 'Mid', 'Expensive']);
    expect(results.map((ad) => ad.price_numeric)).toEqual([100000, 450000, 900000]);
  });

  test('returns price-desc results sorted high to low', async () => {
    const ads = [
      { id: '1', title: 'Cheap', price: 'Rs 100,000', location: 'Kandy', slug: 'cheap-ad' },
      { id: '2', title: 'Expensive', price: 'Rs 900,000', location: 'Colombo', slug: 'expensive-ad' },
      { id: '3', title: 'Mid', price: 'Rs 450,000', location: 'Galle', slug: 'mid-ad' }
    ];

    axios.get
      .mockResolvedValueOnce({ data: buildSearchHtml({ total: 3 }) })
      .mockResolvedValueOnce({ data: buildSearchHtml({ total: 3, ads }) });

    const results = await searchListings('pixel 10 pro', {
      sortBy: 'price-desc',
      maxPages: 1,
      verbose: false
    });

    expect(results.map((ad) => ad.title)).toEqual(['Expensive', 'Mid', 'Cheap']);
    expect(results.map((ad) => ad.price_numeric)).toEqual([900000, 450000, 100000]);
  });
});
