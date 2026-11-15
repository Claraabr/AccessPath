// ★★★★☆ with a text label for screen readers
export function Stars({ value }) {
  const full = Math.round(value);
  return (
    <span className="stars" aria-label={`${value} out of 5`}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
  );
}
