// pending / accepted / declined, in text and color
export function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{status}</span>;
}
