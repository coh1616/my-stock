import { NextRequest } from "next/server";
import { STOCK_NAMES } from "@/lib/stocks";
import type { NewsItem, NewsResponse } from "@/lib/types";

const DEFAULT_STOCK_NO = "2330";
const FETCH_LIMIT = 15;
const MAX_ITEMS = 8;

interface CnyesNewsItem {
  newsId: number;
  title: string | null;
  summary: string | null;
  publishAt: number;
}

function stripTags(text: string | null): string {
  return (text ?? "").replace(/<[^>]*>/g, "");
}

function formatPublishedAt(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function GET(request: NextRequest) {
  const stockNo = request.nextUrl.searchParams.get("stockNo") ?? DEFAULT_STOCK_NO;
  const name =
    request.nextUrl.searchParams.get("name") ?? STOCK_NAMES[stockNo] ?? stockNo;

  const url = new URL("https://ess.api.cnyes.com/ess/api/v1/news/keyword");
  url.searchParams.set("q", name);
  url.searchParams.set("limit", String(FETCH_LIMIT));
  url.searchParams.set("page", "1");

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    return Response.json({ error: "新聞查詢失敗" }, { status: 502 });
  }

  const json: { statusCode: number; data?: { items: CnyesNewsItem[] } } =
    await res.json();

  if (json.statusCode !== 200 || !json.data) {
    return Response.json({ error: "新聞查詢失敗" }, { status: 502 });
  }

  const toNewsItem = (item: CnyesNewsItem): NewsItem => ({
    id: item.newsId,
    title: stripTags(item.title),
    summary: stripTags(item.summary),
    link: `https://news.cnyes.com/news/id/${item.newsId}`,
    publishedAt: formatPublishedAt(item.publishAt),
  });

  const relevant = json.data.items.filter(
    (item) => item.title?.includes(name) || item.summary?.includes(name)
  );

  const source = relevant.length > 0 ? relevant : json.data.items;
  const news = source.slice(0, MAX_ITEMS).map(toNewsItem);

  const response: NewsResponse = { stockNo, name, news };

  return Response.json(response);
}
