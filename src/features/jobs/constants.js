// Dropdown option lists now come from the backend (/meta/options).
// Only presentational styling stays here.
export const jobStatusVariant = (value) =>
  value === 'open' ? 'success' : 'secondary'
