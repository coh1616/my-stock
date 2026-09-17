import type { StockQuote } from "@/lib/types";

function parseNum(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

interface TwseMisEntry {
  c: string;
  n: string;
  z: string;
  pz: string;
  o: string;
  h: string;
  l: string;
  y: string;
  d: string;
  t: string;
}

function toQuote(info: TwseMisEntry): StockQuote {
  const price = parseNum(info.z) ?? parseNum(info.pz);
  const prevClose = parseNum(info.y);

  return {
    stockNo: info.c,
    name: info.n,
    price,
    open: parseNum(info.o),
    high: parseNum(info.h),
    low: parseNum(info.l),
    prevClose,
    change: price !== null && prevClose !== null ? price - prevClose : null,
    changePercent:
      price !== null && prevClose !== null && prevClose !== 0
        ? ((price - prevClose) / prevClose) * 100
        : null,
    date: info.d,
    time: info.t,
  };
}

export async function fetchTwseQuotes(stockNos: string[]): Promise<StockQuote[]> {
  const exCh = stockNos.map((code) => `tse_${code}.tw`).join("|");

  const res = await fetch(
    `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${exCh}&json=1&delay=0`,
    {
      headers: {
        Referer: `https://mis.twse.com.tw/stock/fibest.jsp?stock=${stockNos[0]}`,
        "User-Agent": "Mozilla/5.0",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("TWSE 查詢失敗");
  }

  const data = await res.json();
  const entries: TwseMisEntry[] = data.msgArray ?? [];

  return entries.map(toQuote);
}
