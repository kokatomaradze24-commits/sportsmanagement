export const PAGE_SIZE = 1000;

type PageResult<T> = { data: T[] | null; error: unknown };

/**
 * Loads every row of a list query by paging with .range(from, to) until a short page.
 * The query passed in MUST use a stable, unique ordering (e.g. ending in "id").
 * Throws on any page error so callers never silently keep partial data.
 */
export async function fetchAllPages<T>(
  page: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize = PAGE_SIZE,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) throw error;
    const chunk = data ?? [];
    rows.push(...chunk);
    if (chunk.length < pageSize) return rows;
  }
}
