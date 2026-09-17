import { NextRequest } from "next/server";
import { fetchFinMindData } from "@/lib/finmind";
import type { InstitutionalPoint, InstitutionalResponse } from "@/lib/types";

const DEFAULT_STOCK_NO = "2330";
const TRADING_DAYS = 30;
const LOOKBACK_CALENDAR_DAYS = 60;

function defaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - LOOKBACK_CALENDAR_DAYS);
  return d.toISOString().slice(0, 10);
}

interface FinMindRow {
  date: string;
  stock_id: string;
  name: string;
  buy: number;
  sell: number;
}

function toLots(shares: number): number {
  return Math.round(shares / 1000);
}

export async function GET(request: NextRequest) {
  const stockNo = request.nextUrl.searchParams.get("stockNo") ?? DEFAULT_STOCK_NO;
  const startDate = request.nextUrl.searchParams.get("startDate") ?? defaultStartDate();

  let rows: FinMindRow[];
  try {
    rows = await fetchFinMindData<FinMindRow>("TaiwanStockInstitutionalInvestorsBuySell", {
      data_id: stockNo,
      start_date: startDate,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "FinMind 查詢失敗" },
      { status: 502 }
    );
  }

  const byDate = new Map<string, { foreign: number; trust: number; dealer: number }>();

  for (const row of rows) {
    const net = row.buy - row.sell;
    const entry = byDate.get(row.date) ?? { foreign: 0, trust: 0, dealer: 0 };

    switch (row.name) {
      case "Foreign_Investor":
      case "Foreign_Dealer_Self":
        entry.foreign += net;
        break;
      case "Investment_Trust":
        entry.trust += net;
        break;
      case "Dealer_self":
      case "Dealer_Hedging":
        entry.dealer += net;
        break;
    }

    byDate.set(row.date, entry);
  }

  const data: InstitutionalPoint[] = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { foreign, trust, dealer }]) => ({
      date,
      foreignNet: toLots(foreign),
      trustNet: toLots(trust),
      dealerNet: toLots(dealer),
      totalNet: toLots(foreign + trust + dealer),
    }))
    .slice(-TRADING_DAYS);

  const response: InstitutionalResponse = { stockNo, data };

  return Response.json(response);
}
