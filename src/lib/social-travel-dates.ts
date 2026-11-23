export function formatSocialTravelDates(travelDates?: string | null): string {
  const dates = travelDates?.trim();
  if (!dates || dates.toLowerCase() === 'null') return '';

  return dates
    .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (iso, year, month, day) => {
      const date = new Date(`${iso}T00:00:00Z`);
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return iso;
      return `${month}/${day}/${year.slice(-2)}`;
    })
    .replace(/\s+to\s+/g, ' – ');
}
