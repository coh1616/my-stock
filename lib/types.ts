export interface StockQuote {
  stockNo: string;
  name: string;
  price: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  prevClose: number | null;
  change: number | null;
  changePercent: number | null;
  date: string;
  time: string;
}

export interface StockHistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradingValue: number;
  tradeCount: number;
}

export interface StockHistoryResponse {
  stockNo: string;
  history: StockHistoryPoint[];
}

export interface InstitutionalPoint {
  date: string;
  foreignNet: number;
  trustNet: number;
  dealerNet: number;
  totalNet: number;
}

export interface InstitutionalResponse {
  stockNo: string;
  data: InstitutionalPoint[];
}

export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  link: string;
  publishedAt: string;
}

export interface NewsResponse {
  stockNo: string;
  name: string;
  news: NewsItem[];
}

export interface WatchlistEntry {
  stockNo: string;
  name: string;
}

export interface WatchlistResponse {
  watchlist: WatchlistEntry[];
}

export interface ValuationSnapshot {
  date: string;
  peRatio: number | null;
  pbRatio: number | null;
  dividendYield: number | null;
}

export interface ValuationResponse {
  stockNo: string;
  valuation: ValuationSnapshot | null;
}

export interface AiStockContext {
  stockNo: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  prevClose: number | null;
  volume: number | null;
  tradingValue: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  dividendYield: number | null;
}

export interface AiAnalysisResult {
  sentiment: "利多" | "利空" | "中性";
  reason: string;
}
