import { connectToDatabase } from "@/lib/mongodb";
import { WatchlistItem } from "@/lib/models/WatchlistItem";
import { listWatchlist } from "@/lib/watchlist";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/watchlist/[stockNo]">
) {
  const { stockNo } = await ctx.params;

  await connectToDatabase();
  await WatchlistItem.deleteOne({ stockNo: stockNo.toUpperCase() });

  return Response.json({ watchlist: await listWatchlist() });
}
