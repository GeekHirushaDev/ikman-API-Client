const { validateSearch } = require('../src/validators');

describe('search validation', () => {
  test('accepts valid keyword and options', () => {
    const result = validateSearch('luxury house', {
      maxPages: 2,
      sortBy: 'price-asc',
      delay: { min: 1000, max: 2000 }
    });

    expect(result.keyword).toBe('luxury house');
    expect(result.options.maxPages).toBe(2);
    expect(result.options.sortBy).toBe('price-asc');
  });

  test('throws for invalid sort option', () => {
    expect(() => validateSearch('house', { sortBy: 'invalid-sort' })).toThrow();
  });
});