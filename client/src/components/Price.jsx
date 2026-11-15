// "$15 / day" for a rental, "$120" for a sale
export function Price({ listing }) {
  return (
    <strong>
      ${listing.price}
      {listing.mode === 'rent' ? ' / day' : ''}
    </strong>
  );
}
