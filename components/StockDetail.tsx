"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDateLabel, formatNumber } from "@/lib/format";
import { getStoredApiKey } from "@/lib/apiKey";
import type {
  AiAnalysisResult,
  InstitutionalPoint,
  NewsItem,
  StockHistoryPoint,
  StockQuote,
  ValuationSnapshot,
} from "@/lib/types";

const RANGE_OPTIONS = [
  { days: 30, label: "30天" },
  { days: 90, label: "90天" },
  { days: 180, label: "180天" },
  { days: 365, label: "1年" },
] as const;

function startDateForRange(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: { value: number }[];
  digits?: number;
}

function ChartTooltip({ active, label, payload, digits = 2 }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm shadow-md dark:border-white/10 dark:bg-stone-900">
      <p className="text-stone-500 dark:text-stone-400">{label}</p>
      <p className="font-mono font-medium text-stone-900 dark:text-white">
        {formatNumber(payload[0].value, digits)}
      </p>
    </div>
  );
}

const INSTITUTIONAL_SERIES = [
  { key: "foreignNet", label: "外資", color: "var(--series-1)" },
  { key: "trustNet", label: "投信", color: "var(--series-2)" },
  { key: "dealerNet", label: "自營商", color: "var(--series-3)" },
] as const;

export default function StockDetail({
  stockNo,
  fallbackName,
  quote,
  quoteError,
  onRefreshQuote,
}: {
  stockNo: string;
  fallbackName?: string | null;
  quote: StockQuote | null;
  quoteError: string | null;
  onRefreshQuote: () => void;
}) {
  const [history, setHistory] = useState<StockHistoryPoint[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<number>(180);
  const [institutional, setInstitutional] = useState<InstitutionalPoint[] | null>(
    null
  );
  const [institutionalError, setInstitutionalError] = useState<string | null>(
    null
  );
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [valuation, setValuation] = useState<ValuationSnapshot | null>(null);
  const [valuationError, setValuationError] = useState<string | null>(null);
  const [valuationLoaded, setValuationLoaded] = useState(false);
  const [aiResult, setAiResult] = useState<AiAnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const startDate = startDateForRange(rangeDays);
      const res = await fetch(
        `/api/finmind/history?stockNo=${stockNo}&startDate=${startDate}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "查詢失敗");
      setHistory(data.history);
      setHistoryError(null);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "查詢失敗");
    }
  }, [stockNo, rangeDays]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHistory(null);
      fetchHistory();
    }, 0);
    return () => clearTimeout(timeout);
  }, [fetchHistory]);

  const fetchInstitutional = useCallback(async () => {
    try {
      const res = await fetch(`/api/finmind/institutional?stockNo=${stockNo}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "查詢失敗");
      setInstitutional(data.data);
      setInstitutionalError(null);
    } catch (err) {
      setInstitutionalError(err instanceof Error ? err.message : "查詢失敗");
    }
  }, [stockNo]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setInstitutional(null);
      fetchInstitutional();
    }, 0);
    return () => clearTimeout(timeout);
  }, [fetchInstitutional]);

  const fetchNews = useCallback(async () => {
    try {
      const name = quote?.name ?? fallbackName;
      const nameParam = name ? `&name=${encodeURIComponent(name)}` : "";
      const res = await fetch(`/api/news?stockNo=${stockNo}${nameParam}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "查詢失敗");
      setNews(data.news);
      setNewsError(null);
    } catch (err) {
      setNewsError(err instanceof Error ? err.message : "查詢失敗");
    }
  }, [stockNo, quote, fallbackName]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setNews(null);
      fetchNews();
    }, 0);
    return () => clearTimeout(timeout);
  }, [fetchNews]);

  const fetchValuation = useCallback(async () => {
    try {
      const res = await fetch(`/api/finmind/valuation?stockNo=${stockNo}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "查詢失敗");
      setValuation(data.valuation);
      setValuationError(null);
    } catch (err) {
      setValuationError(err instanceof Error ? err.message : "查詢失敗");
    } finally {
      setValuationLoaded(true);
    }
  }, [stockNo]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setValuation(null);
      setValuationLoaded(false);
      fetchValuation();
    }, 0);
    return () => clearTimeout(timeout);
  }, [fetchValuation]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAiResult(null);
      setAiError(null);
    }, 0);
    return () => clearTimeout(timeout);
  }, [stockNo]);

  async function handleAnalyze() {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setAiError("請先點右上角設定圖示，輸入您的 OpenAI API Key");
      return;
    }

    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          stock: {
            stockNo,
            name: quote?.name ?? fallbackName ?? stockNo,
            price: quote?.price ?? null,
            change: quote?.change ?? null,
            changePercent: quote?.changePercent ?? null,
            open: quote?.open ?? null,
            high: quote?.high ?? null,
            low: quote?.low ?? null,
            prevClose: quote?.prevClose ?? null,
            volume: latestDaily ? Math.round(latestDaily.volume / 1000) : null,
            tradingValue: latestDaily?.tradingValue ?? null,
            peRatio: valuation?.peRatio ?? null,
            pbRatio: valuation?.pbRatio ?? null,
            dividendYield: valuation?.dividendYield ?? null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "分析失敗");
      setAiResult(data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "分析失敗");
    } finally {
      setAiLoading(false);
    }
  }

  const isUp = quote?.change !== null && quote?.change !== undefined && quote.change > 0;
  const isDown = quote?.change !== null && quote?.change !== undefined && quote.change < 0;

  const latestDaily = history?.[history.length - 1] ?? null;

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="panel p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-xl font-semibold text-stone-900 dark:text-white">
              {quote?.name ?? fallbackName ?? "—"}{" "}
              <span className="text-stone-400 dark:text-stone-500">
                ({stockNo})
              </span>
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              資料來源：TWSE 即時報價 · 更新於{" "}
              {quote ? `${quote.date} ${quote.time}` : "—"}
            </p>
          </div>
          <button
            onClick={onRefreshQuote}
            className="rounded-full border border-black/10 px-3 py-1 text-xs text-stone-600 transition-colors hover:bg-black/[.04] dark:border-white/10 dark:text-stone-300 dark:hover:bg-white/[.06]"
          >
            重新整理
          </button>
        </div>

        {quoteError ? (
          <p className="mt-4 text-sm text-[var(--status-error)]">{quoteError}</p>
        ) : (
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <p className="font-mono text-4xl font-semibold tabular-nums text-stone-900 dark:text-white">
              {formatNumber(quote?.price ?? null)}
            </p>
            {quote?.change !== null && quote?.change !== undefined && (
              <p
                className="font-mono text-sm font-medium tabular-nums"
                style={{
                  color: isUp
                    ? "var(--delta-up)"
                    : isDown
                      ? "var(--delta-down)"
                      : "var(--text-secondary)",
                }}
              >
                {isUp ? "▲" : isDown ? "▼" : "–"}{" "}
                {isUp ? "+" : isDown ? "-" : ""}
                {formatNumber(Math.abs(quote.change))} (
                {isUp ? "+" : isDown ? "-" : ""}
                {formatNumber(Math.abs(quote.changePercent ?? 0))}%)
              </p>
            )}
          </div>
        )}

        <dl className="mt-6 grid grid-cols-2 gap-3 text-center text-sm sm:grid-cols-4 lg:grid-cols-7">
          {[
            { label: "開盤", value: quote?.open },
            { label: "最高", value: quote?.high },
            { label: "最低", value: quote?.low },
            { label: "昨收", value: quote?.prevClose },
            {
              label: "成交量(張)",
              value: latestDaily ? Math.round(latestDaily.volume / 1000) : null,
              digits: 0,
            },
            {
              label: "成交金額(億)",
              value: latestDaily ? latestDaily.tradingValue / 1e8 : null,
              digits: 2,
            },
            {
              label: "成交筆數",
              value: latestDaily?.tradeCount ?? null,
              digits: 0,
            },
          ].map(({ label, value, digits }) => (
            <div key={label}>
              <dt className="text-xs text-stone-500 dark:text-stone-400">{label}</dt>
              <dd className="font-mono tabular-nums text-stone-900 dark:text-white">
                {formatNumber(value ?? null, digits)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
          成交量／金額／筆數為最近交易日資料 · 資料來源：FinMind
        </p>
      </section>

      <section className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-stone-600 dark:text-stone-300">
              AI 分析
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              使用您自己的 OpenAI API Key，依目前股價與估值資訊判斷利多或利空
            </p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={aiLoading}
            className="shrink-0 rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:opacity-50 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
          >
            {aiLoading ? "分析中…" : "AI 分析"}
          </button>
        </div>

        {aiError && (
          <p className="mt-3 text-sm text-[var(--status-error)]">{aiError}</p>
        )}

        {aiResult && (
          <div className="mt-4 flex items-start gap-3">
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                color:
                  aiResult.sentiment === "利多"
                    ? "var(--delta-up)"
                    : aiResult.sentiment === "利空"
                      ? "var(--delta-down)"
                      : "var(--text-secondary)",
                background:
                  aiResult.sentiment === "利多"
                    ? "color-mix(in srgb, var(--delta-up) 12%, transparent)"
                    : aiResult.sentiment === "利空"
                      ? "color-mix(in srgb, var(--delta-down) 12%, transparent)"
                      : "color-mix(in srgb, var(--text-secondary) 12%, transparent)",
              }}
            >
              {aiResult.sentiment}
            </span>
            <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-200">
              {aiResult.reason}
            </p>
          </div>
        )}
      </section>

      <section className="panel p-6">
        <h2 className="text-sm font-medium text-stone-600 dark:text-stone-300">
          估值
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          最近交易日資料 · 資料來源：FinMind ·（ETF 無估值資料）
        </p>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
          {[
            {
              label: "本益比",
              value: valuationLoaded ? valuation?.peRatio ?? null : null,
            },
            {
              label: "股價淨值比",
              value: valuationLoaded ? valuation?.pbRatio ?? null : null,
            },
            {
              label: "殖利率(%)",
              value: valuationLoaded ? valuation?.dividendYield ?? null : null,
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-stone-500 dark:text-stone-400">{label}</dt>
              <dd className="font-mono tabular-nums text-stone-900 dark:text-white">
                {formatNumber(value ?? null, 2)}
              </dd>
            </div>
          ))}
        </dl>
        {valuationError && (
          <p className="mt-3 text-xs text-[var(--status-error)]">{valuationError}</p>
        )}
      </section>

      <section className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-stone-600 dark:text-stone-300">
              收盤價趨勢
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              資料來源：FinMind
            </p>
          </div>
          <div
            role="group"
            aria-label="時間區間"
            className="flex gap-1 rounded-full border border-black/10 p-1 dark:border-white/10"
          >
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.days}
                onClick={() => setRangeDays(option.days)}
                aria-pressed={rangeDays === option.days}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  rangeDays === option.days
                    ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                    : "text-stone-600 hover:bg-black/[.04] dark:text-stone-300 dark:hover:bg-white/[.06]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 h-72 w-full">
          {historyError ? (
            <p className="text-sm text-[var(--status-error)]">{historyError}</p>
          ) : !history ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">載入中…</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--chart-grid)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  stroke="var(--chart-axis)"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--chart-axis)" }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  stroke="var(--chart-axis)"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="var(--series-1)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="panel p-6">
        <h2 className="text-sm font-medium text-stone-600 dark:text-stone-300">
          三大法人買賣（近 30 個交易日，張）
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          資料來源：FinMind · 正值為買超，負值為賣超
        </p>
        {institutionalError ? (
          <p className="mt-4 text-sm text-[var(--status-error)]">
            {institutionalError}
          </p>
        ) : !institutional ? (
          <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
            載入中…
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-6">
            {INSTITUTIONAL_SERIES.map((series) => {
              const total = institutional.reduce(
                (sum, point) => sum + point[series.key],
                0
              );
              const totalIsUp = total > 0;
              const totalIsDown = total < 0;

              return (
                <div key={series.key}>
                  <h3 className="flex items-center justify-between text-xs font-medium text-stone-600 dark:text-stone-300">
                    <span>{series.label}</span>
                    <span
                      className="font-mono tabular-nums"
                      style={{
                        color: totalIsUp
                          ? "var(--delta-up)"
                          : totalIsDown
                            ? "var(--delta-down)"
                            : "var(--text-secondary)",
                      }}
                    >
                      區間{totalIsUp ? "+" : totalIsDown ? "-" : ""}
                      {formatNumber(Math.abs(total), 0)} 張
                    </span>
                  </h3>
                  <div className="mt-2 h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={institutional}
                        margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          vertical={false}
                          stroke="var(--chart-grid)"
                          strokeDasharray="3 3"
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDateLabel}
                          stroke="var(--chart-axis)"
                          tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                          tickLine={false}
                          axisLine={{ stroke: "var(--chart-axis)" }}
                          interval="preserveStartEnd"
                          minTickGap={20}
                        />
                        <YAxis
                          stroke="var(--chart-axis)"
                          tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => formatNumber(value, 0)}
                          width={48}
                        />
                        <ReferenceLine y={0} stroke="var(--chart-axis)" />
                        <Tooltip
                          content={<ChartTooltip digits={0} />}
                          cursor={{ fill: "var(--chart-grid)" }}
                        />
                        <Bar
                          dataKey={series.key}
                          fill={series.color}
                          radius={[2, 2, 2, 2]}
                          isAnimationActive={false}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="panel p-6">
        <h2 className="text-sm font-medium text-stone-600 dark:text-stone-300">
          相關新聞
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          資料來源：鉅亨網
        </p>
        {newsError ? (
          <p className="mt-4 text-sm text-[var(--status-error)]">{newsError}</p>
        ) : !news ? (
          <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
            載入中…
          </p>
        ) : news.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
            目前沒有相關新聞
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {news.map((item) => (
              <li
                key={item.id}
                className="border-b border-black/5 pb-4 last:border-0 last:pb-0 dark:border-white/5"
              >
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-stone-900 hover:underline dark:text-white"
                >
                  {item.title}
                </a>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  {item.publishedAt}
                </p>
                {item.summary && (
                  <p className="mt-1 line-clamp-2 text-sm text-stone-600 dark:text-stone-300">
                    {item.summary}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
