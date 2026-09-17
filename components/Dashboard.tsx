"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { StockQuote, WatchlistEntry } from "@/lib/types";
import StockTickerCard from "@/components/StockTickerCard";
import StockDetail from "@/components/StockDetail";

const QUOTE_REFRESH_MS = 30_000;

export default function Dashboard() {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[] | null>(null);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [quotesError, setQuotesError] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [newCode, setNewCode] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch("/api/watchlist", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "查詢失敗");
      setWatchlist(data.watchlist);
      setWatchlistError(null);
    } catch (err) {
      setWatchlistError(err instanceof Error ? err.message : "查詢失敗");
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchWatchlist, 0);
    return () => clearTimeout(timeout);
  }, [fetchWatchlist]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (watchlist === null) return;
      const codes = watchlist.map((entry) => entry.stockNo);
      setSelectedStock((prev) => (prev && codes.includes(prev) ? prev : codes[0] ?? null));
    }, 0);
    return () => clearTimeout(timeout);
  }, [watchlist]);

  const fetchQuotes = useCallback(async () => {
    if (!watchlist || watchlist.length === 0) return;
    try {
      const codes = watchlist.map((entry) => entry.stockNo);
      const res = await fetch(`/api/twse/quote?stockNo=${codes.join(",")}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "查詢失敗");
      const next: Record<string, StockQuote> = {};
      for (const quote of data.quotes as StockQuote[]) {
        next[quote.stockNo] = quote;
      }
      setQuotes(next);
      setQuotesError(null);
    } catch (err) {
      setQuotesError(err instanceof Error ? err.message : "查詢失敗");
    }
  }, [watchlist]);

  useEffect(() => {
    if (!watchlist || watchlist.length === 0) return;
    const timeout = setTimeout(fetchQuotes, 0);
    const interval = setInterval(fetchQuotes, QUOTE_REFRESH_MS);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [fetchQuotes, watchlist]);

  async function handleAddStock(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const stockNo = newCode.trim().toUpperCase();
    if (!stockNo) return;

    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockNo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "新增失敗");
      setWatchlist(data.watchlist);
      setNewCode("");
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "新增失敗");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveStock(stockNo: string) {
    try {
      const res = await fetch(`/api/watchlist/${stockNo}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "移除失敗");
      setWatchlist(data.watchlist);
    } catch (err) {
      setWatchlistError(err instanceof Error ? err.message : "移除失敗");
    }
  }

  const selectedEntry = watchlist?.find((entry) => entry.stockNo === selectedStock) ?? null;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">
            自選股
          </p>
          <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
            點選卡片查看該股票的詳細資訊
          </p>
        </div>

        <form onSubmit={handleAddStock} className="flex gap-2">
          <input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="輸入股票代碼，例如 2317"
            className="panel w-44 px-4 py-2 text-sm text-stone-900 outline-none transition-shadow placeholder:text-stone-400 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--series-1)_18%,transparent)] dark:text-white sm:w-52"
          />
          <button
            type="submit"
            disabled={adding}
            className="shrink-0 rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
          >
            新增追蹤
          </button>
        </form>
      </div>

      {addError && (
        <p className="text-sm text-[var(--status-error)]">{addError}</p>
      )}
      {watchlistError && (
        <p className="text-sm text-[var(--status-error)]">{watchlistError}</p>
      )}
      {quotesError && (
        <p className="text-sm text-[var(--status-error)]">{quotesError}</p>
      )}

      {watchlist === null ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">載入中…</p>
      ) : watchlist.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">
          尚未追蹤任何股票，請在上方輸入股票代碼新增。
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {watchlist.map((entry) => (
            <StockTickerCard
              key={entry.stockNo}
              stockNo={entry.stockNo}
              fallbackName={entry.name}
              quote={quotes[entry.stockNo]}
              selected={selectedStock === entry.stockNo}
              onSelect={() => setSelectedStock(entry.stockNo)}
              onRemove={() => handleRemoveStock(entry.stockNo)}
            />
          ))}
        </div>
      )}

      {selectedStock && (
        <StockDetail
          stockNo={selectedStock}
          fallbackName={selectedEntry?.name ?? null}
          quote={quotes[selectedStock] ?? null}
          quoteError={quotesError}
          onRefreshQuote={fetchQuotes}
        />
      )}
    </div>
  );
}
