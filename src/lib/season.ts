export const SEASON_START_MONTH = 9;
export const SEASON_DURATION_MONTHS = 10;
export const SEASON_END_MONTH = 6;

export function getSeasonStartYear(date = new Date()): number {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return month <= 6 ? year - 1 : year;
}

export function getSeasonYearForMonth(month: number, date = new Date()): number {
  const seasonStartYear = getSeasonStartYear(date);
  return month < SEASON_START_MONTH ? seasonStartYear + 1 : seasonStartYear;
}

export function getRemainingSeasonMonths(startMonth: number): number {
  if (startMonth >= SEASON_START_MONTH) return 12 - startMonth + 1 + SEASON_END_MONTH;
  if (startMonth <= SEASON_END_MONTH) return SEASON_END_MONTH - startMonth + 1;
  return SEASON_DURATION_MONTHS;
}

export function getSeasonRegistrationDefaults(date = new Date()) {
  const currentMonth = date.getMonth() + 1;
  const startMonth = currentMonth >= SEASON_START_MONTH || currentMonth <= SEASON_END_MONTH
    ? currentMonth
    : SEASON_START_MONTH;

  return {
    startMonth,
    startYear: getSeasonYearForMonth(startMonth, date),
    subscriptionMonths: getRemainingSeasonMonths(startMonth),
  };
}
