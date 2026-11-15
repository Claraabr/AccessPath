// A search box is text, not a regex: "(" or ".*" must be searched as they are.
// Puts a \ in front of every character that means something in a regex.
export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
