"use client";

import { useEffect, useState } from "react";
import { getStoredApiKey, setStoredApiKey } from "@/lib/apiKey";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setKey(getStoredApiKey());
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  function handleSave() {
    setStoredApiKey(key.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleClear() {
    setKey("");
    setStoredApiKey("");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-[var(--background)]/80 backdrop-blur-md dark:border-white/10">
      <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-3.5">
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{
            background:
              "linear-gradient(135deg, var(--series-1), var(--series-3))",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 17l5-5.5 4 3 5-6.5 4 4" />
          </svg>
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-stone-900 dark:text-white">
          我的股票摘要站
        </span>

        <div className="relative ml-auto">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="設定"
            aria-expanded={open}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-black/5 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4.5 w-4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {open && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpen(false)}
              />
              <div className="panel absolute right-0 top-full z-20 mt-2 w-72 p-4">
                <p className="text-xs font-medium text-stone-600 dark:text-stone-300">
                  OpenAI API Key
                </p>
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="sk-..."
                  className="mt-2 w-full rounded-lg border border-black/10 bg-transparent px-3 py-1.5 text-sm text-stone-900 outline-none focus:border-black/30 dark:border-white/10 dark:text-white dark:focus:border-white/30"
                />
                <p className="mt-2 text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                  金鑰只會儲存在您瀏覽器的 localStorage，不會上傳到我們的伺服器。用於「AI
                  分析」功能，由您自己的 OpenAI 帳號計費。
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
                  >
                    儲存
                  </button>
                  <button
                    onClick={handleClear}
                    className="rounded-lg border border-black/10 px-3 py-1.5 text-xs text-stone-600 transition-colors hover:bg-black/[.04] dark:border-white/10 dark:text-stone-300 dark:hover:bg-white/[.06]"
                  >
                    清除
                  </button>
                  {saved && (
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      已儲存
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
