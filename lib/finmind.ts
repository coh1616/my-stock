interface FinMindApiResponse<T> {
  status: number;
  msg?: string;
  data: T[];
}

export async function fetchFinMindData<T>(
  dataset: string,
  params: Record<string, string>
): Promise<T[]> {
  const url = new URL("https://api.finmindtrade.com/api/v4/data");
  url.searchParams.set("dataset", dataset);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const token = process.env.FINMIND_API_TOKEN;
  if (token) {
    url.searchParams.set("token", token);
  }

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `FinMind 查詢失敗（HTTP ${res.status}）${text ? `：${text.slice(0, 200)}` : ""}`
    );
  }

  const json: FinMindApiResponse<T> = await res.json();

  if (json.status !== 200) {
    throw new Error(
      `FinMind 查詢失敗（status ${json.status}）${json.msg ? `：${json.msg}` : ""}`
    );
  }

  return json.data;
}
