const { extractAdFromHTML } = require('../src/adClient');

describe('adClient extractAdFromHTML', () => {
  test('extracts ad payload from inline initialData', () => {
    const html = `
      <html>
        <head></head>
        <body>
          <script>
            window.initialData = {
              adDetail: {
                type: 'Success',
                data: {
                  ad: {
                    id: '1',
                    title: 'Test House',
                    description: 'Nice house',
                    url: 'https://ikman.lk/en/ad/test-house',
                    slug: 'test-house',
                    type: 'for_sale',
                    money: { amount: '22000000', negotiable: 'Negotiable' },
                    location: { id: 1, name: 'Ja-Ela' },
                    area: { id: 2, name: 'Gampaha' },
                    category: { id: 415, slug: 'houses-for-sale', name: 'Houses For Sale', parent: { id: 409, name: 'Property' } },
                    timestamp: '23 Feb 4:36 pm',
                    adDate: '2026-02-23T16:36:49+05:30',
                    deactivates: '2026-04-24T11:06:49.000Z',
                    statistics: { views: 10 },
                    account: { id: 'seller1' },
                    contactCard: { name: 'John', phoneNumbers: [{ number: '0771234567', verified: true }], chatEnabled: true },
                    images: { meta: [{ src: 'https://img1' }] },
                    imgUrl: 'https://img1',
                    properties: [{ key: 'bedrooms', value: '3' }]
                  },
                  similarAds: []
                }
              }
            };
          </script>
        </body>
      </html>
    `;

    const parsed = extractAdFromHTML(html, 'https://ikman.lk/en/ad/test-house');
    expect(parsed.id).toBe('1');
    expect(parsed.title).toBe('Test House');
    expect(parsed.location).toContain('Ja-Ela');
    expect(parsed.bedrooms).toBe('3');
    expect(parsed.contact.phone_numbers).toHaveLength(1);
  });

  test('throws if ad data is missing', () => {
    expect(() => extractAdFromHTML('<html></html>', 'https://ikman.lk/en/ad/x')).toThrow();
  });
});