"use client";

import { formatNumber } from "@/lib/format";
import type { StockQuote } from "@/lib/types";

export default function StockTickerCard({
  stockNo,
  fallbackName,
  quote,
  selected,
  onSelect,
  onRemove,
}: {
  stockNo: string;
  fallbackName?: string;
  quote: StockQuote | undefined;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const isUp = quote?.change !== null && quote?.change !== undefined && quote.change > 0;
  const isDown = quote?.change !== null && quote?.change !== undefined && quote.change < 0;

  return (
    <div className="relative">
      <button
        onClick={onSelect}
        aria-pressed={selected}
        className="panel flex w-full flex-col items-start gap-1 p-4 text-left transition-all hover:-translate-y-0.5"
        style={
          selected
            ? {
                borderColor: "color-mix(in srgb, var(--series-1) 55%, var(--panel-border))",
                boxShadow:
                  "0 0 0 1px color-mix(in srgb, var(--series-1) 35%, transparent), var(--panel-shadow)",
              }
            : undefined
        }
      >
        <p className="text-xs text-stone-500 dark:text-stone-400">{stockNo}</p>
        <p className="truncate text-sm font-medium text-stone-900 dark:text-white">
          {quote?.name ?? fallbackName ?? "—"}
        </p>
        <p className="font-mono text-lg font-semibold tabular-nums text-stone-900 dark:text-white">
          {formatNumber(quote?.price ?? null)}
        </p>
        <p
          className="font-mono text-xs font-medium tabular-nums"
          style={{
            color: isUp
              ? "var(--delta-up)"
              : isDown
                ? "var(--delta-down)"
                : "var(--text-secondary)",
          }}
        >
          {quote?.changePercent !== null && quote?.changePercent !== undefined
            ? `${isUp ? "▲ +" : isDown ? "▼ -" : "–"}${formatNumber(
                Math.abs(quote.changePercent)
              )}%`
            : "—"}
        </p>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={`從追蹤清單移除 ${stockNo}`}
        className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-900/10 hover:text-stone-900 dark:hover:bg-white/10 dark:hover:text-white"
      >
        ×
      </button>
    </div>
  );
}
