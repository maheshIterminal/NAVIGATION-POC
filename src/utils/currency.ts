const audFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
});

export function formatAud(amount: number): string {
  return audFormatter.format(amount);
}
