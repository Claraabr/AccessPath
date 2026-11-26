// The 4 accessibility criteria, used by places and by reviews
export const CRITERIA = ['stepFree', 'elevator', 'toilets', 'parking'];

// What a visitor ticked in a review: only these 4 keys, and true only when it is really true
export function readFound(body) {
  const found = {};
  for (const key of CRITERIA) found[key] = body.found?.[key] === true;
  return found;
}
