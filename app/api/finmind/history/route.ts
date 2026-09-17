import { NextRequest } from "next/server";
import { fetchFinMindData } from "@/lib/finmind";
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

  let rows: FinMindRow[];
  try {
    rows = await fetchFinMindData<FinMindRow>("TaiwanStockPrice", {
      data_id: stockNo,
      start_date: startDate,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "FinMind 查詢失敗" },
      { status: 502 }
    );
  }

  const history: StockHistoryPoint[] = rows.map((row) => ({
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
