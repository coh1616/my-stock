import { NextRequest } from "next/server";
import { fetchFinMindData } from "@/lib/finmind";
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

  let rows: FinMindRow[];
  try {
    rows = await fetchFinMindData<FinMindRow>("TaiwanStockPER", {
      data_id: stockNo,
      start_date: startDate,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "FinMind 查詢失敗" },
      { status: 502 }
    );
  }

  const latest = rows.at(-1);

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
