import { WatchlistItem } from "@/lib/models/WatchlistItem";
import { STOCK_NAMES } from "@/lib/stocks";
import type { WatchlistEntry } from "@/lib/types";

export async function listWatchlist(): Promise<WatchlistEntry[]> {
  const items = await WatchlistItem.find().sort({ createdAt: 1 });

  const backfills: Promise<unknown>[] = [];
  for (const item of items) {
    if (!item.name) {
      item.name = STOCK_NAMES[item.stockNo] ?? item.stockNo;
      backfills.push(item.save());
    }
  }
  if (backfills.length > 0) {
    await Promise.all(backfills);
  }

  return items.map((item) => ({ stockNo: item.stockNo, name: item.name }));
}
