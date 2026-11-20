import { describe, it, expect } from 'vitest';
import { distanceKm, formatDistance, sortByDistance } from './location.js';

const BEIRUT = { lat: 33.8938, lng: 35.5018 };
const TRIPOLI = { lat: 34.4367, lng: 35.8497 };

describe('location', () => {
  it('measures about 68 km between Beirut and Tripoli', () => {
    const km = distanceKm(BEIRUT, TRIPOLI);
    expect(km).toBeGreaterThan(65);
    expect(km).toBeLessThan(72);
  });

  it('writes meters under 1 km and km after', () => {
    expect(formatDistance(0.35)).toBe('350 m');
    expect(formatDistance(4.23)).toBe('4.2 km');
  });

  it('puts the closest first and the ones without a position last', () => {
    const items = [{ name: 'Tripoli', ...TRIPOLI }, { name: 'No position' }, { name: 'Beirut', ...BEIRUT }];
    const names = sortByDistance(items, BEIRUT).map((item) => item.name);
    expect(names).toEqual(['Beirut', 'Tripoli', 'No position']);
  });
});
