import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { WatchlistItem } from "@/lib/models/WatchlistItem";
import { listWatchlist } from "@/lib/watchlist";
import { DEFAULT_WATCHLIST, STOCK_CODE_PATTERN, STOCK_NAMES } from "@/lib/stocks";
import { fetchTwseQuotes } from "@/lib/twse";

export async function GET() {
  await connectToDatabase();

  const count = await WatchlistItem.countDocuments();
  if (count === 0) {
    await WatchlistItem.insertMany(
      DEFAULT_WATCHLIST.map((stockNo) => ({
        stockNo,
        name: STOCK_NAMES[stockNo] ?? stockNo,
      }))
    );
  }

  return Response.json({ watchlist: await listWatchlist() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const stockNo = String(body.stockNo ?? "")
    .trim()
    .toUpperCase();

  if (!STOCK_CODE_PATTERN.test(stockNo)) {
    return Response.json({ error: "股票代碼格式不正確" }, { status: 400 });
  }

  let name: string;
  try {
    const [quote] = await fetchTwseQuotes([stockNo]);
    if (!quote?.name) {
      return Response.json({ error: "找不到此股票代碼" }, { status: 404 });
    }
    name = quote.name;
  } catch {
    return Response.json({ error: "股票代碼驗證失敗，請稍後再試" }, { status: 502 });
  }

  await connectToDatabase();

  try {
    await WatchlistItem.create({ stockNo, name });
  } catch (err) {
    const isDuplicateKeyError =
      err instanceof Error && "code" in err && (err as { code?: number }).code === 11000;
    if (!isDuplicateKeyError) throw err;
    return Response.json({ error: "已在追蹤清單中" }, { status: 409 });
  }

  return Response.json({ watchlist: await listWatchlist() });
}
