import { NextRequest } from "next/server";
import type { ValuationResponse, ValuationSnapshot } from "@/lib/types";

const DEFAULT_STOCK_NO = "2330";
const LOOKBACK_CALENDAR_DAYS = 10;

function defaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - LOOKBACK_CALENDAR_DAYS);
  return d.toISOString().slice(0, 10);
}

interface FinMindRow {
  date: string;
  dividend_yield: number;
  PER: number;
  PBR: number;
}

export async function GET(request: NextRequest) {
  const stockNo = request.nextUrl.searchParams.get("stockNo") ?? DEFAULT_STOCK_NO;
  const startDate = request.nextUrl.searchParams.get("startDate") ?? defaultStartDate();

  const url = new URL("https://api.finmindtrade.com/api/v4/data");
  url.searchParams.set("dataset", "TaiwanStockPER");
  url.searchParams.set("data_id", stockNo);
  url.searchParams.set("start_date", startDate);

  const token = process.env.FINMIND_API_TOKEN;
  if (token) {
    url.searchParams.set("token", token);
  }

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    return Response.json({ error: "FinMind 查詢失敗" }, { status: 502 });
  }

  const json: { status: number; msg: string; data: FinMindRow[] } = await res.json();

  if (json.status !== 200) {
    return Response.json({ error: json.msg ?? "FinMind 查詢失敗" }, { status: 502 });
  }

  const latest = json.data.at(-1);

  const valuation: ValuationSnapshot | null = latest
    ? {
        date: latest.date,
        peRatio: latest.PER,
        pbRatio: latest.PBR,
        dividendYield: latest.dividend_yield,
      }
    : null;

  const response: ValuationResponse = { stockNo, valuation };

  return Response.json(response);
}
