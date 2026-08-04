import { describe, expect, it } from 'vitest';

import { searchIcons, type SearchIndex } from '../src/search';

const index: SearchIndex = {
  names: ['house', 'square-activity', 'rabbit'],
  aliases: { 'activity-square': 'square-activity' },
};

describe('searchIcons', () => {
  it('returns every name for an empty query, up to the limit', () => {
    expect(searchIcons(index, '', 2)).toEqual(['house', 'square-activity']);
  });

  it('matches a name directly', () => {
    expect(searchIcons(index, 'rabbit', 10)).toEqual(['rabbit']);
  });

  it('matches an old name through its alias', () => {
    expect(searchIcons(index, 'activity-square', 10)).toEqual(['square-activity']);
  });

  it('caps the result count at the limit', () => {
    expect(searchIcons(index, '', 1)).toHaveLength(1);
  });
});
