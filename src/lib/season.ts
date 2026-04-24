export const SEASON_START_MONTH = 9;
export const SEASON_DURATION_MONTHS = 10;

export function getSeasonStartYear(date = new Date()): number {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return month <= 6 ? year - 1 : year;
}
