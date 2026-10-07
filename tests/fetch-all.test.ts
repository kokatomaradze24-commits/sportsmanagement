import { expect, test } from "bun:test";
import { fetchAllPages } from "../src/lib/fetch-all";

const rows = Array.from({ length: 2350 }, (_, i) => ({ id: i }));
const fakeRange = (from: number, to: number) =>
  Promise.resolve({ data: rows.slice(from, Math.min(to, 999 + from) + 1), error: null });

test("returns all 2350 rows in order", async () => {
  const calls: number[] = [];
  const all = await fetchAllPages((from, to) => { calls.push(from); return fakeRange(from, to); });
  expect(all.length).toBe(2350);
  expect(all.every((r, i) => r.id === i)).toBe(true);
  expect(calls).toEqual([0, 1000, 2000]);
});

test("exact multiple of page size ends with an empty page", async () => {
  const exact = rows.slice(0, 2000);
  const all = await fetchAllPages((f, t) => Promise.resolve({ data: exact.slice(f, t + 1), error: null }));
  expect(all.length).toBe(2000);
});

test("throws on a page error instead of returning partial data", async () => {
  await expect(
    fetchAllPages((f, t) => Promise.resolve(f === 1000 ? { data: null, error: new Error("boom") } : { data: rows.slice(f, t + 1), error: null })),
  ).rejects.toThrow("boom");
});
