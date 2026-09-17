import { NextRequest } from "next/server";
import { fetchTwseQuotes } from "@/lib/twse";

const DEFAULT_STOCK_NOS = ["2330"];

export async function GET(request: NextRequest) {
  const stockNos = (
    request.nextUrl.searchParams.get("stockNo")?.split(",") ?? DEFAULT_STOCK_NOS
  )
    .map((code) => code.trim())
    .filter(Boolean);

  let quotes;
  try {
    quotes = await fetchTwseQuotes(stockNos);
  } catch {
    return Response.json({ error: "TWSE 查詢失敗" }, { status: 502 });
  }

  if (quotes.length === 0) {
    return Response.json({ error: "找不到股票資料，可能已收盤且無快取" }, { status: 404 });
  }

  return Response.json({ quotes });
}
