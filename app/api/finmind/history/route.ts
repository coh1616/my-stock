import { NextRequest } from "next/server";
import type { StockHistoryPoint, StockHistoryResponse } from "@/lib/types";

const DEFAULT_STOCK_NO = "2330";

function defaultStartDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d.toISOString().slice(0, 10);
}

interface FinMindRow {
  date: string;
  open: number;
  max: number;
  min: number;
  close: number;
  Trading_Volume: number;
  Trading_money: number;
  Trading_turnover: number;
}

export async function GET(request: NextRequest) {
  const stockNo = request.nextUrl.searchParams.get("stockNo") ?? DEFAULT_STOCK_NO;
  const startDate = request.nextUrl.searchParams.get("startDate") ?? defaultStartDate();

  const url = new URL("https://api.finmindtrade.com/api/v4/data");
  url.searchParams.set("dataset", "TaiwanStockPrice");
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

  const history: StockHistoryPoint[] = json.data.map((row) => ({
    date: row.date,
    open: row.open,
    high: row.max,
    low: row.min,
    close: row.close,
    volume: row.Trading_Volume,
    tradingValue: row.Trading_money,
    tradeCount: row.Trading_turnover,
  }));

  const response: StockHistoryResponse = { stockNo, history };

  return Response.json(response);
}
