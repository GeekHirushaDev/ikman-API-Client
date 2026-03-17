const { extractSearchSummaryFromHTML } = require('../src/searchClient');

describe('search summary parser', () => {
  test('extracts total/access counts and applies 400 cap', () => {
    const html = `
      <html>
        <body>
          <script>
            window.initialData = {
              serp: {
                ads: {
                  data: {
                    paginationData: { total: 288, pageSize: 25 },
                    postedAdCount: 288
                  }
                }
              }
            };
          </script>
        </body>
      </html>
    `;

    const summary = extractSearchSummaryFromHTML(html);

    expect(summary.total_count).toBe(288);
    expect(summary.accessible_count).toBe(288);
    expect(summary.max_accessible_pages).toBe(12);
    expect(summary.is_capped).toBe(false);
  });

  test('caps accessible count to latest 400', () => {
    const html = `
      <html>
        <body>
          <script>
            window.initialData = {
              serp: {
                ads: {
                  data: {
                    paginationData: { total: 1200, pageSize: 25 },
                    postedAdCount: 1200
                  }
                }
              }
            };
          </script>
        </body>
      </html>
    `;

    const summary = extractSearchSummaryFromHTML(html);

    expect(summary.total_count).toBe(1200);
    expect(summary.accessible_count).toBe(400);
    expect(summary.max_accessible_pages).toBe(16);
    expect(summary.is_capped).toBe(true);
    expect(summary.access_limit).toBe(400);
  });
});