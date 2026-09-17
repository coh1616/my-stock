import { NextRequest } from "next/server";
import type { AiAnalysisResult, AiStockContext } from "@/lib/types";

const MODEL = "gpt-4o-mini";

function formatValue(value: number | null, suffix = ""): string {
  return value === null || value === undefined ? "無資料" : `${value}${suffix}`;
}

function buildPrompt(stock: AiStockContext): string {
  return `請以台股分析師的角度，分析以下個股目前的即時資訊，判斷目前狀況偏向利多、利空還是中性，並用繁體中文簡短說明原因（2-4 句話，需引用數據）。

股票代號：${stock.stockNo}
名稱：${stock.name}
目前股價：${formatValue(stock.price)}
漲跌：${formatValue(stock.change)}（${formatValue(stock.changePercent, "%")}）
開盤：${formatValue(stock.open)}
最高：${formatValue(stock.high)}
最低：${formatValue(stock.low)}
昨收：${formatValue(stock.prevClose)}
成交量（張）：${formatValue(stock.volume)}
成交金額（元）：${formatValue(stock.tradingValue)}
本益比：${formatValue(stock.peRatio)}
股價淨值比：${formatValue(stock.pbRatio)}
殖利率：${formatValue(stock.dividendYield, "%")}

請只輸出 JSON，格式如下，不要有其他文字：
{"sentiment": "利多" | "利空" | "中性", "reason": "..."}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  const stock = body.stock as AiStockContext | undefined;

  if (!apiKey) {
    return Response.json({ error: "缺少 OpenAI API Key" }, { status: 400 });
  }
  if (!stock?.stockNo) {
    return Response.json({ error: "缺少股票資訊" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "你是專業的台股分析助理，會根據使用者提供的個股即時資訊做出客觀分析，並嚴格以指定的 JSON 格式回覆。",
          },
          { role: "user", content: buildPrompt(stock) },
        ],
      }),
    });
  } catch {
    return Response.json({ error: "無法連接 OpenAI，請稍後再試" }, { status: 502 });
  }

  if (res.status === 401) {
    return Response.json(
      { error: "OpenAI API Key 無效，請確認後重新輸入" },
      { status: 401 }
    );
  }
  if (res.status === 429) {
    return Response.json(
      { error: "已達 OpenAI 用量限制，請稍後再試" },
      { status: 429 }
    );
  }
  if (!res.ok) {
    return Response.json({ error: "OpenAI 分析失敗，請稍後再試" }, { status: 502 });
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    return Response.json({ error: "OpenAI 回應格式不正確" }, { status: 502 });
  }

  let parsed: AiAnalysisResult;
  try {
    parsed = JSON.parse(content);
  } catch {
    return Response.json({ error: "OpenAI 回應格式不正確" }, { status: 502 });
  }

  if (!parsed.sentiment || !parsed.reason) {
    return Response.json({ error: "OpenAI 回應格式不正確" }, { status: 502 });
  }

  return Response.json(parsed);
}
